import http from "node:http";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  initialState,
  applyProbe
} from "../hunt/engine.mjs";

const ROOT = new URL("../", import.meta.url);
const SESSION_TTL = 30 * 60 * 1000;
const MAX_SESSIONS = 1000;

const staticFiles = new Map([
  ["/", ["index.html", "text/html"]],
  ["/index.html", ["index.html", "text/html"]],
  ["/logo.png", ["logo.png", "image/png"]],
  ["/tic-tac-toe/", ["tic-tac-toe/index.html", "text/html"]],
  ["/hunt/", ["hunt/index.html", "text/html"]],
  ["/hunt/style.css", ["hunt/style.css", "text/css"]],
  ["/hunt/app.mjs", ["hunt/app.mjs", "text/javascript"]],
  ["/hunt/zk-session.mjs", ["hunt/zk-session.mjs", "text/javascript"]],
  ["/hunt/engine.mjs", ["hunt/engine.mjs", "text/javascript"]]
]);


// BEGIN ZK DIAGNOSTICS ROUTES
const bundle = new URL(
  "prover/browser/dist/", ROOT
);

const mime = {
  html: "text/html",
  js: "text/javascript",
  mjs: "text/javascript",
  css: "text/css",
  wasm: "application/wasm",
  json: "application/json"
};

function addBundleFiles(directory, prefix = "") {
  for (const entry of readdirSync(
    directory, { withFileTypes: true }
  )) {
    const relative = prefix + entry.name;

    if (entry.isDirectory()) {
      addBundleFiles(
        new URL(entry.name + "/", directory),
        relative + "/"
      );
    } else if (entry.isFile()) {
      const extension = entry.name.split(".").pop();

      staticFiles.set(
        "/zk-check/" + relative,
        [
          "prover/browser/dist/" + relative,
          mime[extension] ||
            "application/octet-stream"
        ]
      );
    }
  }
}

if (existsSync(bundle)) {
  addBundleFiles(bundle);
  staticFiles.set(
    "/zk-check/",
    [
      "prover/browser/dist/index.html",
      "text/html"
    ]
  );
}
// END ZK DIAGNOSTICS ROUTES

function loadChallenges(directory) {
  assert(directory, "TACIT_DATA_DIR required");

  const read = name => JSON.parse(
    readFileSync(join(directory, name), "utf8")
  );

  // Deliberately never open witness-vault.json.
  const manifest = read("manifest.json");
  const responses = read("responses.json");

  assert.equal(manifest.version, 1);
  assert.equal(responses.version, 1);
  assert.equal(manifest.game, "tacit-hunt");
  assert.equal(manifest.challenges.length, 5);
  assert.equal(responses.challenges.length, 5);

  const challenges = new Map();

  function checkProof(p, id, commitment, square, hit) {
    assert(
      JSON.stringify(p.publicInputs) ===
      JSON.stringify([
        String(id),
        commitment,
        String(square),
        hit ? "1" : "0"
      ]),
      "Public input mismatch"
    );

    assert(
      typeof p.proof === "string" &&
      Buffer.from(p.proof, "base64").length === 14656,
      "Invalid proof payload"
    );
  }

  for (const c of manifest.challenges) {
    assert(!challenges.has(c.id));

    checkProof(
      c.registration,
      c.id,
      c.commitment,
      25,
      false
    );

    const r = responses.challenges.find(
      x => x.id === c.id
    );

    assert(r);
    assert.equal(r.commitment, c.commitment);
    assert.equal(r.probes.length, 25);
    assert.equal(r.probes.filter(p => p.hit).length, 4);

    const probes = new Map();

    for (const p of r.probes) {
      assert(Number.isInteger(p.square));
      assert(p.square >= 0 && p.square < 25);
      assert(typeof p.hit === "boolean");
      assert(!probes.has(p.square));

      checkProof(
        p, c.id, c.commitment, p.square, p.hit
      );

      probes.set(p.square, p);
    }

    challenges.set(c.id, {
      commitment: c.commitment,
      probes
    });
  }

  return { manifest, challenges };
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });

  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let length = 0;

  for await (const chunk of req) {
    length += chunk.length;

    if (length > 4096)
      throw Error("Request too large");

    chunks.push(chunk);
  }

  return JSON.parse(
    Buffer.concat(chunks).toString("utf8")
  );
}

export function createChallengeServer(directory) {
  const { manifest, challenges } =
    loadChallenges(directory);

  const sessions = new Map();

  return http.createServer(async (req, res) => {
    try {
      const port = req.socket.localPort;

      const hosts = [
        `127.0.0.1:${port}`,
        `localhost:${port}`
      ];

      if (!hosts.includes(req.headers.host))
        return json(res, 403, {
          error: "Host rejected"
        });

      if (req.headers.origin &&
          req.headers.origin !==
            `http://${req.headers.host}`)
        return json(res, 403, {
          error: "Origin rejected"
        });

      const path = new URL(
        req.url, "http://localhost"
      ).pathname;

      if (req.method === "GET" &&
          path === "/api/challenges")
        return json(res, 200, manifest);

      if (req.method === "POST" &&
          path === "/api/session") {

        const { challengeId } = await readBody(req);

        if (!challenges.has(challengeId))
          return json(res, 404, {
            error: "Unknown challenge"
          });

        const now = Date.now();

        for (const [id, s] of sessions)
          if (s.expires <= now) sessions.delete(id);

        if (sessions.size >= MAX_SESSIONS)
          return json(res, 429, {
            error: "Session capacity reached"
          });

        const sessionId =
          randomBytes(32).toString("hex");

        sessions.set(sessionId, {
          challengeId,
          expires: now + SESSION_TTL,
          state: initialState()
        });

        return json(res, 201, {
          sessionId,
          challengeId,
          remaining: 12
        });
      }

      if (req.method === "POST" &&
          path === "/api/probe") {

        const { sessionId, square } =
          await readBody(req);

        const session = sessions.get(sessionId);

        if (!session ||
            session.expires <= Date.now()) {
          sessions.delete(sessionId);

          return json(res, 404, {
            error: "Unknown or expired session"
          });
        }

        if (!Number.isInteger(square) ||
            square < 0 || square >= 25)
          return json(res, 400, {
            error: "Invalid square"
          });

        const challenge = challenges.get(
          session.challengeId
        );

        const response = challenge.probes.get(square);

        try {
          session.state = applyProbe(
            session.state,
            square,
            response.hit
          );
        } catch {
          return json(res, 409, {
            error: "Probe not permitted"
          });
        }

        return json(res, 200, {
          challengeId: session.challengeId,
          commitment: challenge.commitment,
          square,
          hit: response.hit,
          publicInputs: response.publicInputs,
          proof: response.proof,
          remaining: session.state.remaining,
          status: session.state.status
        });
      }

      // Explicit allowlist: no repository browsing,
      // private data access, or arbitrary file paths.
      if (req.method === "GET" &&
          staticFiles.has(path)) {

        const [file, type] = staticFiles.get(path);

        res.writeHead(200, {
          "Content-Type": type,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store"
        });

        return res.end(
          readFileSync(new URL(file, ROOT))
        );
      }

      return json(res, 404, {
        error: "Not found"
      });

    } catch {
      // Never return internal exceptions or data.
      if (!res.headersSent)
        json(res, 400, {
          error: "Request rejected"
        });
      else
        res.end();
    }
  });
}

if (process.argv[1] &&
    import.meta.url ===
      pathToFileURL(process.argv[1]).href) {

  const server = createChallengeServer(
    process.env.TACIT_DATA_DIR
  );

  server.listen(8787, "127.0.0.1", () => {
    console.log(
      "TACIT ARENA: http://127.0.0.1:8787/"
    );
    console.log("MODE: LOCAL_ONLY");
    console.log("WITNESS_VAULT_ACCESS: DISABLED");
  });
}
