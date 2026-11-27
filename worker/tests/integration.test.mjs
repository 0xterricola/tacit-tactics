import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const base = "http://127.0.0.1:8790/api";
const origin = "https://0xterricola.github.io";

const fixtures = JSON.parse(
  readFileSync(
    join(process.env.TACIT_DATA_DIR, "responses.json"),
    "utf8"
  )
);

const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../prover/browser/manifest.json",
      import.meta.url
    ),
    "utf8"
  )
);

async function request(path, body) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: origin,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });

  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    origin
  );

  return {
    code: response.status,
    body: await response.json()
  };
}

async function session(challengeId = 1) {
  const result = await request("/session", {
    challengeId
  });

  assert.equal(result.code, 201);
  assert.equal(result.body.remaining, 12);
  assert.match(result.body.sessionId, /^[a-f0-9]{64}$/);

  return result.body.sessionId;
}

const probe = (sessionId, square) =>
  request("/probe", {sessionId, square});

test("Worker health", async () => {
  const result = await request("/health");
  assert.equal(result.code, 200);
  assert.equal(result.body.service, "tacit-hunt");
});

test("Public manifest matches pinned manifest", async () => {
  const result = await request("/challenges");

  assert.equal(result.code, 200);
  assert(
    JSON.stringify(result.body) === JSON.stringify(manifest),
    "Manifest mismatch"
  );
});

test("All five challenges serve authentic payloads", async () => {
  for (const challenge of manifest.challenges) {
    const id = await session(challenge.id);
    const result = await probe(id, 0);

    const expected = fixtures.challenges
      .find(c => c.id === challenge.id)
      .probes.find(p => p.square === 0);

    assert.equal(result.code, 200);
    assert.equal(result.body.challengeId, challenge.id);
    assert(result.body.proof === expected.proof);
    assert(result.body.hit === expected.hit);
    assert.equal(result.body.remaining, 11);
  }
});

test("Concurrent duplicate probes: exactly one accepted", async () => {
  const id = await session();

  const results = await Promise.all(
    Array.from({length: 8}, () => probe(id, 0))
  );

  assert.equal(
    results.filter(r => r.code === 200).length,
    1
  );

  assert.equal(
    results.filter(r => r.code === 409).length,
    7
  );
});

test("Concurrent probe budget cannot exceed twelve", async () => {
  const id = await session();

  const misses = fixtures.challenges[0].probes
    .filter(p => !p.hit)
    .slice(0, 16);

  const results = await Promise.all(
    misses.map(p => probe(id, p.square))
  );

  const accepted = results.filter(r => r.code === 200);

  assert.equal(accepted.length, 12);

  assert.equal(
    results.filter(r => r.code === 409).length,
    4
  );

  assert.deepEqual(
    accepted.map(r => r.body.remaining)
      .sort((a,b) => a-b),
    Array.from({length: 12}, (_, i) => i)
  );
});

test("Victory terminates session", async () => {
  const id = await session();

  const hits = fixtures.challenges[0].probes
    .filter(p => p.hit);

  let result;

  for (const p of hits) {
    result = await probe(id, p.square);
    assert.equal(result.code, 200);
  }

  assert.equal(result.body.status, "won");

  const miss = fixtures.challenges[0].probes
    .find(p => !p.hit);

  assert.equal(
    (await probe(id, miss.square)).code,
    409
  );
});

test("Unknown challenge rejected", async () => {
  assert.equal(
    (await request("/session", {challengeId: 999})).code,
    404
  );
});

test("Invalid session rejected", async () => {
  assert.equal(
    (await probe("invalid", 0)).code,
    404
  );
});

test("Foreign origin rejected", async () => {
  const result = await fetch(base + "/challenges", {
    headers: {
      Origin: "https://untrusted.example"
    }
  });

  assert.equal(result.status, 403);
});

test("GitHub Pages CORS preflight", async () => {
  const result = await fetch(base + "/probe", {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type"
    }
  });

  assert.equal(result.status, 204);

  assert.equal(
    result.headers.get("Access-Control-Allow-Origin"),
    origin
  );
});

test("Private response files inaccessible", async () => {
  for (const file of [
    "/responses.json",
    "/kv-import.json",
    "/witness-vault.json"
  ]) {
    const result = await fetch(base + file);
    assert.equal(result.status, 404);
  }
});
