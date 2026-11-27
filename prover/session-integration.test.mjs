import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";

import {
  Barretenberg,
  UltraHonkBackend
} from "@aztec-foundation/bb.js";

import {
  createChallengeServer
} from "../service/server.mjs";

import {
  openChallenge
} from "../hunt/zk-session.mjs";

const read = path => JSON.parse(
  readFileSync(new URL(path, import.meta.url), "utf8")
);

const circuit = read("./browser/circuit.json");
const manifest = read("./browser/manifest.json");
const challenge = manifest.challenges[0];

const options = {
  verifierTarget: "noir-recursive"
};

test("Adversarial ZK gameplay integration", async t => {
  const api = await Barretenberg.new({threads: 1});

  const backend = new UltraHonkBackend(
    circuit.bytecode, api
  );

  const server = createChallengeServer(
    process.env.TACIT_DATA_DIR
  );

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const base =
    `http://127.0.0.1:${server.address().port}/api`;

  const verifier = {
    async verify(c, square, hit, response) {
      const expected = [
        String(c.id),
        c.commitment,
        String(square),
        hit ? "1" : "0"
      ];

      if (
        JSON.stringify(expected) !==
        JSON.stringify(response.publicInputs)
      ) return false;

      try {
        return await backend.verifyProof({
          proof: new Uint8Array(
            Buffer.from(response.proof, "base64")
          ),
          publicInputs: expected.map(
            x => "0x" + BigInt(x)
              .toString(16).padStart(64, "0")
          )
        }, options);
      } catch {
        return false;
      }
    }
  };

  async function post(path, body) {
    const r = await fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    assert.equal(r.ok, true);

    return r.json();
  }

  async function session(mutate = x => x) {
    return openChallenge({
      challenge,
      verifier,
      post: async (path, body) => {
        const result = await post(path, body);

        return path === "/probe"
          ? mutate(result)
          : result;
      }
    });
  }

  try {
    await t.test("authentic proof accepted", async () => {
      const opponent = await session();
      const result = await opponent.probe(0);

      assert.equal(result.verified, true);
      assert.equal(result.mode, "zk");
    });

    await t.test("duplicate probe rejected", async () => {
      const opponent = await session();

      await opponent.probe(0);

      await assert.rejects(
        () => opponent.probe(0)
      );
    });

    const attacks = {
      wrongChallenge: r => ({
        ...r, challengeId: r.challengeId + 1
      }),

      wrongCommitment: r => ({
        ...r, commitment: "1"
      }),

      wrongSquare: r => ({
        ...r, square: 1
      }),

      forgedHit: r => ({
        ...r,
        hit: !r.hit,
        publicInputs: [
          ...r.publicInputs.slice(0, 3),
          r.hit ? "0" : "1"
        ]
      }),

      corruptedProof: r => {
        const bytes = Buffer.from(r.proof, "base64");

        bytes[bytes.length - 1] ^= 1;

        return {
          ...r,
          proof: bytes.toString("base64")
        };
      },

      wrongBudget: r => ({
        ...r, remaining: r.remaining + 1
      }),

      wrongStatus: r => ({
        ...r, status: "won"
      })
    };

    for (const [name, mutate] of Object.entries(attacks)) {
      await t.test(`${name}: fail closed`, async () => {
        const opponent = await session(mutate);

        await assert.rejects(
          () => opponent.probe(0)
        );

        // A rejected response permanently invalidates
        // the session rather than allowing divergence.
        await assert.rejects(
          () => opponent.probe(1),
          /Session invalidated/
        );
      });
    }

    await t.test("invalid registration blocks session", async () => {
      let requests = 0;

      const forged = {
        ...challenge,
        commitment: "1"
      };

      await assert.rejects(() => openChallenge({
        challenge: forged,
        verifier,
        post: async () => {
          requests++;
          throw Error("Unexpected API call");
        }
      }));

      assert.equal(requests, 0);
    });

    await t.test("positive control after attacks", async () => {
      const opponent = await session();

      assert.equal(
        (await opponent.probe(0)).verified,
        true
      );
    });

  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await api.destroy();
  }
});
