import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import { Noir } from "@noir-lang/noir_js";

import {
  Barretenberg,
  UltraHonkBackend
} from "@aztec-foundation/bb.js";

import { placements } from "../hunt/engine.mjs";

function artifact(name) {
  return JSON.parse(readFileSync(
    new URL(
      `../circuits/${name}/target/${name}.json`,
      import.meta.url
    ),
    "utf8"
  ));
}

const commitCircuit = artifact("hunt_commitment");
const probeCircuit = artifact("hunt_probe");

const commitNoir = new Noir(commitCircuit);
const probeNoir = new Noir(probeCircuit);

// PUBLIC TEST FIXTURE — NOT A REAL SECRET BOARD.
const challenge_id = 1;
const placement = 0;
const salt = "123456";

const board = placements()[placement];
const hitSquare = board[0];
const missSquare = Array.from(
  {length: 25}, (_, i) => i
).find(i => !board.includes(i));

const { returnValue } = await commitNoir.execute({
  challenge_id,
  placement,
  salt
});

const commitment = BigInt(returnValue).toString();

console.log("COMMITMENT:", commitment);

const api = await Barretenberg.new({
  threads: 1
});

const backend = new UltraHonkBackend(
  probeCircuit.bytecode,
  api
);

// Explicitly enable the zero-knowledge flavor.
const options = {
  verifierTarget: "noir-recursive"
};

const fieldHex = value =>
  "0x" + BigInt(value).toString(16).padStart(64, "0");

async function prove(label, square, hit) {
  const inputs = {
    challenge_id,
    commitment,
    square,
    hit,
    placement,
    salt
  };

  const start = performance.now();

  const { witness } = await probeNoir.execute(inputs);

  const witnessMs = performance.now() - start;
  const provingStart = performance.now();

  const proof = await backend.generateProof(
    witness,
    options
  );

  const provingMs = performance.now() - provingStart;

  assert.deepEqual(
    proof.publicInputs.map(x => BigInt(x)),
    [
      BigInt(challenge_id),
      BigInt(commitment),
      BigInt(square),
      hit ? 1n : 0n
    ],
    "Unexpected public input encoding"
  );

  const verificationStart = performance.now();

  const verified = await backend.verifyProof(
    proof,
    options
  );

  const verificationMs =
    performance.now() - verificationStart;

  assert.equal(verified, true);

  console.log(JSON.stringify({
    test: label,
    square,
    hit,
    proofBytes: proof.proof.byteLength,
    publicInputs: proof.publicInputs.length,
    witnessMs: Math.round(witnessMs),
    provingMs: Math.round(provingMs),
    verificationMs: Math.round(verificationMs),
    verified
  }));

  return proof;
}

async function reject(label, proof) {
  let accepted;

  try {
    accepted = await backend.verifyProof(
      proof,
      options
    );
  } catch {
    accepted = false;
  }

  assert.equal(
    accepted, false,
    `${label}: invalid proof accepted`
  );

  console.log(`${label}: REJECTED`);
}

try {
  await prove("BOARD_REGISTRATION", 25, false);

  const hitProof = await prove(
    "VALID_HIT", hitSquare, true
  );

  await prove("VALID_MISS", missSquare, false);

  const mutations = [
    ["CHALLENGE_ID", 0, 2n],
    ["COMMITMENT", 1, BigInt(commitment) + 1n],
    ["SQUARE", 2, BigInt(missSquare)],
    ["HIT_FLAG", 3, 0n]
  ];

  for (const [label, index, value] of mutations) {
    const publicInputs = [...hitProof.publicInputs];
    publicInputs[index] = fieldHex(value);

    await reject(`TAMPER_${label}`, {
      ...hitProof,
      publicInputs
    });
  }

  const damaged = hitProof.proof.slice();
  damaged[damaged.length - 1] ^= 1;

  await reject("TAMPER_PROOF_BYTES", {
    ...hitProof,
    proof: damaged
  });

  // Confirm normal verification still works.
  assert.equal(
    await backend.verifyProof(hitProof, options),
    true
  );

  console.log("POSITIVE_CONTROL: PASS");
  console.log("M4.1: PASS");

} finally {
  await api.destroy();
}
