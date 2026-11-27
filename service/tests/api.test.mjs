import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { once } from "node:events";

import {
  createChallengeServer
} from "../server.mjs";

const directory = process.env.TACIT_DATA_DIR;

const fixtures = JSON.parse(
  readFileSync(
    join(directory, "responses.json"), "utf8"
  )
);

test("Challenge service integration", async t => {
  const server = createChallengeServer(directory);

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const base =
    `http://127.0.0.1:${server.address().port}`;

  async function post(path, body) {
    const r = await fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    return {
      code: r.status,
      body: await r.json()
    };
  }

  async function session(challengeId = 1) {
    const r = await post("/api/session", {
      challengeId
    });

    assert.equal(r.code, 201);
    assert.equal(r.body.remaining, 12);
    return r.body.sessionId;
  }

  const probe = (sessionId, square) =>
    post("/api/probe", { sessionId, square });

  try {
    await t.test("public manifest", async () => {
      const r = await fetch(base + "/api/challenges");
      const body = await r.json();

      assert.equal(r.status, 200);
      assert.equal(body.challenges.length, 5);

      for (const c of body.challenges) {
        assert(!("placement" in c));
        assert(!("salt" in c));
        assert(!("probes" in c));
        assert(c.registration.proof.length > 0);
      }
    });

    await t.test("private files inaccessible", async () => {
      for (const path of [
        "/responses.json",
        "/witness-vault.json",
        "/.git/config",
        "/service/server.mjs",
        "/prover/generate-challenges.mjs"
      ]) {
        const r = await fetch(base + path);
        assert.equal(r.status, 404);
      }
    });

    await t.test("unknown challenge rejected", async () => {
      const r = await post("/api/session", {
        challengeId: 999
      });

      assert.equal(r.code, 404);
    });

    await t.test("unknown session rejected", async () => {
      const r = await probe("invalid", 0);
      assert.equal(r.code, 404);
    });

    await t.test("invalid square rejected", async () => {
      const id = await session();

      for (const square of [-1, 25, 1.5, "0"])
        assert.equal(
          (await probe(id, square)).code,
          400
        );
    });

    await t.test("duplicate probe rejected", async () => {
      const id = await session();

      assert.equal((await probe(id, 0)).code, 200);
      assert.equal((await probe(id, 0)).code, 409);
    });

    await t.test("response matches fixture", async () => {
      const id = await session();
      const response = await probe(id, 0);
      const expected = fixtures.challenges[0]
        .probes.find(p => p.square === 0);

      assert.equal(response.code, 200);
      assert(response.body.hit === expected.hit);
      assert(response.body.proof === expected.proof);
      assert.equal(response.body.remaining, 11);
    });

    await t.test("twelve probe limit", async () => {
      const id = await session();

      const misses = fixtures.challenges[0]
        .probes.filter(p => !p.hit);

      for (const p of misses.slice(0, 12))
        assert.equal(
          (await probe(id, p.square)).code,
          200
        );

      assert.equal(
        (await probe(id, misses[12].square)).code,
        409
      );
    });

    await t.test("victory closes session", async () => {
      const id = await session();

      const hits = fixtures.challenges[0]
        .probes.filter(p => p.hit);

      let result;

      for (const p of hits)
        result = await probe(id, p.square);

      assert.equal(result.body.status, "won");

      const miss = fixtures.challenges[0]
        .probes.find(p => !p.hit);

      assert.equal(
        (await probe(id, miss.square)).code,
        409
      );
    });

    await t.test("sessions are isolated", async () => {
      const a = await session();
      const b = await session();

      assert(a !== b);
      assert.equal((await probe(a, 0)).code, 200);
      assert.equal((await probe(b, 0)).code, 200);
    });

    await t.test("foreign origin rejected", async () => {
      const r = await fetch(base + "/api/challenges", {
        headers: {
          Origin: "https://untrusted.example"
        }
      });

      assert.equal(r.status, 403);
    });

  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
