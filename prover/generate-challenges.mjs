import assert from "node:assert/strict";

import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  chmodSync
} from "node:fs";

import {
  randomBytes,
  randomInt,
  createHash
} from "node:crypto";

import { homedir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import { Noir } from "@noir-lang/noir_js";

import {
  Barretenberg,
  UltraHonkBackend
} from "@aztec-foundation/bb.js";

import {
  placements,
  validBoard
} from "../hunt/engine.mjs";

process.umask(0o077);

const names = [
  "Genesis",
  "Shadow",
  "Phantom",
  "Cipher",
  "Nullifier"
];

const options = {
  verifierTarget: "noir-recursive"
};

const boards = placements();

assert.equal(boards.length, 28);

function artifact(name) {
  return readFileSync(new URL(
    `../circuits/${name}/target/${name}.json`,
    import.meta.url
  ));
}

const probeBytes = artifact("hunt_probe");
const probeCircuit = JSON.parse(probeBytes);

const commitCircuit = JSON.parse(
  artifact("hunt_commitment")
);

const circuitHash = createHash("sha256")
  .update(probeBytes)
  .digest("hex");

const probeNoir = new Noir(probeCircuit);
const commitNoir = new Noir(commitCircuit);

function randomSalt() {
  let salt;

  do {
    salt = BigInt(
      "0x" + randomBytes(31).toString("hex")
    );
  } while (salt === 0n);

  return salt.toString();
}

function serializeProof(proof) {
  return {
    publicInputs: proof.publicInputs.map(
      x => BigInt(x).toString()
    ),
    proof: Buffer.from(proof.proof)
      .toString("base64")
  };
}

function writePrivate(path, value) {
  writeFileSync(
    path,
    JSON.stringify(value, null, 2) + "\n",
    { mode: 0o600, flag: "wx" }
  );
}

const output = mkdtempSync(
  join(homedir(), ".tacit-tactics-private-")
);

chmodSync(output, 0o700);

console.log("PRIVATE_OUTPUT:", output);
console.log("SECRET_LOGGING: DISABLED");

const api = await Barretenberg.new({
  threads: 1
});

const backend = new UltraHonkBackend(
  probeCircuit.bytecode,
  api
);

const started = performance.now();

const manifest = {
  version: 1,
  game: "tacit-hunt",
  circuitSha256: circuitHash,
  provingSystem: "UltraHonk",
  verifierTarget: options.verifierTarget,
  challenges: []
};

const responses = {
  version: 1,
  challenges: []
};

const vault = {
  version: 1,
  challenges: []
};

const used = new Set();

let verified = 0;
let totalBytes = 0;

async function generateProof(
  challenge_id,
  commitment,
  square,
  hit,
  placement,
  salt
) {
  const { witness } = await probeNoir.execute({
    challenge_id,
    commitment,
    square,
    hit,
    placement,
    salt
  });

  const proof = await backend.generateProof(
    witness,
    options
  );

  assert.deepEqual(
    proof.publicInputs.map(x => BigInt(x)),
    [
      BigInt(challenge_id),
      BigInt(commitment),
      BigInt(square),
      hit ? 1n : 0n
    ]
  );

  assert.equal(
    await backend.verifyProof(proof, options),
    true
  );

  verified++;
  totalBytes += proof.proof.byteLength;

  return serializeProof(proof);
}

try {
  for (let i = 0; i < names.length; i++) {
    const challenge_id = i + 1;

    let placement;

    do {
      placement = randomInt(boards.length);
    } while (used.has(placement));

    used.add(placement);

    const board = boards[placement];

    assert.equal(validBoard(board), true);

    const salt = randomSalt();

    const { returnValue } = await commitNoir.execute({
      challenge_id,
      placement,
      salt
    });

    const commitment =
      BigInt(returnValue).toString();

    const registration = await generateProof(
      challenge_id,
      commitment,
      25,
      false,
      placement,
      salt
    );

    manifest.challenges.push({
      id: challenge_id,
      name: names[i],
      commitment,
      registration
    });

    const probes = [];

    for (let square = 0; square < 25; square++) {
      const hit = board.includes(square);

      const proof = await generateProof(
        challenge_id,
        commitment,
        square,
        hit,
        placement,
        salt
      );

      probes.push({
        square,
        hit,
        ...proof
      });
    }

    assert.equal(probes.length, 25);

    assert.equal(
      probes.filter(p => p.hit).length,
      4
    );

    responses.challenges.push({
      id: challenge_id,
      commitment,
      probes
    });

    vault.challenges.push({
      id: challenge_id,
      placement,
      salt
    });

    console.log(
      `CHALLENGE_${challenge_id}: ` +
      `${names[i]} | 26/26 proofs verified`
    );
  }

  assert.equal(verified, 130);
  assert.equal(used.size, 5);

  writePrivate(
    join(output, "manifest.json"),
    manifest
  );

  writePrivate(
    join(output, "responses.json"),
    responses
  );

  writePrivate(
    join(output, "witness-vault.json"),
    vault
  );

  console.log("DISTINCT_BOARDS: 5");
  console.log("REGISTRATION_PROOFS: 5");
  console.log("PROBE_PROOFS: 125");
  console.log("VERIFIED_PROOFS:", verified);
  console.log("RAW_PROOF_BYTES:", totalBytes);

  console.log(
    "ELAPSED_MS:",
    Math.round(performance.now() - started)
  );

  console.log("M4.2: PASS");

} catch {
  // Do not print exceptions that could contain
  // private circuit inputs.
  console.error("M4.2: FAIL");
  process.exitCode = 1;
} finally {
  await api.destroy();
}
