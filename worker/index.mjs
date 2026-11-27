import { DurableObject } from "cloudflare:workers";

import {
  initialState,
  applyProbe
} from "../hunt/engine.mjs";

import manifest from "../prover/browser/manifest.json";

const SESSION_TTL = 30 * 60 * 1000;

const allowedOrigins = new Set([
  "https://0xterricola.github.io",
  "http://127.0.0.1:8787",
  "http://localhost:8787"
]);

const challenges = new Map(
  manifest.challenges.map(c => [c.id, c])
);

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

function cors(response, origin) {
  const headers = new Headers(response.headers);

  headers.set("Vary", "Origin");

  if (origin && allowedOrigins.has(origin)) {
    headers.set(
      "Access-Control-Allow-Origin", origin
    );
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );
  }

  return new Response(response.body, {
    status: response.status,
    headers
  });
}

async function readBody(request) {
  const reader = request.body?.getReader();

  if (!reader) throw Error("Missing body");

  const chunks = [];
  let size = 0;

  try {
    while (true) {
      const {done, value} = await reader.read();

      if (done) break;

      size += value.byteLength;

      if (size > 4096) {
        await reader.cancel();
        throw Error("Body too large");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(
    new TextDecoder().decode(bytes)
  );
}

function proofKey(challenge, square) {
  return `v1:${challenge.commitment}:${square}`;
}

export class HuntSession extends DurableObject {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const body = await request.json();

    if (path === "/init") {
      const challenge = challenges.get(body.challengeId);

      if (!challenge)
        return json(404, {error: "Unknown challenge"});

      const expires = Date.now() + SESSION_TTL;

      const created =
        await this.ctx.storage.transaction(async txn => {
          if (await txn.get("session")) return false;

          await txn.put("session", {
            challengeId: challenge.id,
            commitment: challenge.commitment,
            expires,
            state: initialState()
          });

          return true;
        });

      if (!created)
        return json(409, {error: "Session exists"});

      await this.ctx.storage.setAlarm(expires);

      return json(201, {
        challengeId: challenge.id,
        remaining: 12
      });
    }

    if (path !== "/probe")
      return json(404, {error: "Not found"});

    const square = body.square;

    if (!Number.isInteger(square) ||
        square < 0 || square >= 25)
      return json(400, {error: "Invalid square"});

    const current = await this.ctx.storage.get("session");

    if (!current || current.expires <= Date.now())
      return json(404, {error: "Session expired"});

    if (current.state.status !== "active" ||
        current.state.probes.some(p => p.index === square))
      return json(409, {error: "Probe not permitted"});

    const challenge = challenges.get(current.challengeId);

    if (!challenge ||
        current.commitment !== challenge.commitment)
      return json(409, {error: "Challenge rotated"});

    const proof = await this.env.PROOFS.get(
      proofKey(challenge, square),
      "json"
    );

    if (!proof)
      return json(503, {error: "Proof unavailable"});

    if (
      proof.square !== square ||
      typeof proof.hit !== "boolean" ||
      typeof proof.proof !== "string" ||
      proof.proof.length !== 19544 ||
      JSON.stringify(proof.publicInputs) !==
        JSON.stringify([
          String(challenge.id),
          challenge.commitment,
          String(square),
          proof.hit ? "1" : "0"
        ])
    )
      return json(503, {error: "Invalid stored response"});

    // Recheck and update atomically after the KV read.
    const result =
      await this.ctx.storage.transaction(async txn => {
        const session = await txn.get("session");

        if (!session || session.expires <= Date.now())
          return {code: 404};

        if (session.commitment !== challenge.commitment)
          return {code: 409};

        let next;

        try {
          next = applyProbe(
            session.state,
            square,
            proof.hit
          );
        } catch {
          return {code: 409};
        }

        session.state = next;

        await txn.put("session", session);

        return {
          code: 200,
          remaining: next.remaining,
          status: next.status
        };
      });

    if (result.code !== 200)
      return json(result.code, {
        error: "Probe not permitted"
      });

    return json(200, {
      challengeId: challenge.id,
      commitment: challenge.commitment,
      square,
      hit: proof.hit,
      publicInputs: proof.publicInputs,
      proof: proof.proof,
      remaining: result.remaining,
      status: result.status
    });
  }

  async alarm() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (origin && !allowedOrigins.has(origin))
      return json(403, {error: "Origin rejected"});

    const path = new URL(request.url).pathname;

    const reply = (status, body) =>
      cors(json(status, body), origin);

    try {
      if (request.method === "OPTIONS")
        return cors(
          new Response(null, {status: 204}),
          origin
        );

      if (request.method === "GET" &&
          path === "/api/health")
        return reply(200, {
          service: "tacit-hunt",
          version: 1
        });

      if (request.method === "GET" &&
          path === "/api/challenges")
        return reply(200, manifest);

      if (request.method !== "POST" ||
          !["/api/session", "/api/probe"].includes(path))
        return reply(404, {error: "Not found"});

      if (!request.headers.get("Content-Type")
          ?.startsWith("application/json"))
        return reply(415, {error: "JSON required"});


      // BEGIN RATE LIMITING
      const limiter = path === "/api/session"
        ? env.SESSION_LIMITER
        : env.PROBE_LIMITER;

      const key =
        request.headers.get("CF-Connecting-IP")
        || "shared-fallback";

      const { success } = await limiter.limit({ key });

      if (!success)
        return reply(429, {
          error: "Rate limit exceeded"
        });
      // END RATE LIMITING

      const body = await readBody(request);

      if (path === "/api/session") {
        if (!challenges.has(body.challengeId))
          return reply(404, {error: "Unknown challenge"});

        const id = env.SESSIONS.newUniqueId();
        const stub = env.SESSIONS.get(id);

        const response = await stub.fetch(
          "https://session.internal/init",
          {
            method: "POST",
            body: JSON.stringify({
              challengeId: body.challengeId
            })
          }
        );

        if (!response.ok)
          return reply(503, {
            error: "Session initialization failed"
          });

        return reply(201, {
          ...await response.json(),
          sessionId: id.toString()
        });
      }

      if (typeof body.sessionId !== "string" ||
          !/^[a-f0-9]{64}$/.test(body.sessionId))
        return reply(404, {error: "Invalid session"});

      let id;

      try {
        id = env.SESSIONS.idFromString(body.sessionId);
      } catch {
        return reply(404, {error: "Invalid session"});
      }

      const response = await env.SESSIONS.get(id).fetch(
        "https://session.internal/probe",
        {
          method: "POST",
          body: JSON.stringify({square: body.square})
        }
      );

      return cors(response, origin);

    } catch {
      return reply(400, {error: "Request rejected"});
    }
  }
};
