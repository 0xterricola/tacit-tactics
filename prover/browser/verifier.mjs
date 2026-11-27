import {
  Barretenberg,
  UltraHonkBackend
} from "@aztec-foundation/bb.js";

import circuitRaw from "./circuit.json?raw";
import manifest from "./manifest.json";

const circuit = JSON.parse(circuitRaw);

const OPTIONS = {
  verifierTarget: "noir-recursive"
};

const FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export { manifest };

function require(condition, message) {
  if (!condition) throw Error(message);
}

function field(value) {
  require(
    typeof value === "string" &&
    /^(0|[1-9][0-9]*)$/.test(value),
    "Noncanonical field"
  );

  const n = BigInt(value);

  require(
    n >= 0n && n < FIELD_MODULUS,
    "Field out of range"
  );

  return n;
}

function hexField(value) {
  return "0x" +
    field(value).toString(16).padStart(64, "0");
}

export async function createVerifier() {
  const hash = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(circuitRaw)
    )
  );

  const digest = Array.from(
    hash,
    b => b.toString(16).padStart(2, "0")
  ).join("");

  require(
    digest === manifest.circuitSha256,
    "Circuit hash mismatch"
  );

  require(
    manifest.version === 1 &&
    manifest.game === "tacit-hunt" &&
    manifest.provingSystem === "UltraHonk" &&
    manifest.verifierTarget === OPTIONS.verifierTarget,
    "Unsupported manifest"
  );

  const api = await Barretenberg.new({
    threads: 1
  });

  const backend = new UltraHonkBackend(
    circuit.bytecode,
    api
  );

  async function verify(
    challenge,
    square,
    hit,
    response
  ) {
    require(
      Number.isInteger(square) &&
      square >= 0 && square <= 25,
      "Invalid square"
    );

    require(
      typeof hit === "boolean",
      "Invalid hit flag"
    );

    require(
      square !== 25 || hit === false,
      "Invalid registration"
    );

    const expected = [
      String(challenge.id),
      challenge.commitment,
      String(square),
      hit ? "1" : "0"
    ];

    require(
      Array.isArray(response.publicInputs) &&
      response.publicInputs.length === 4 &&
      expected.every(
        (value, i) =>
          value === response.publicInputs[i]
      ),
      "Public statement mismatch"
    );

    require(
      typeof response.proof === "string" &&
      response.proof.length === 19544,
      "Unexpected proof encoding"
    );

    const proof = Uint8Array.from(
      atob(response.proof),
      c => c.charCodeAt(0)
    );

    require(
      proof.length === 14656,
      "Unexpected proof length"
    );

    const result = await backend.verifyProof({
      proof,
      publicInputs: expected.map(hexField)
    }, OPTIONS);

    require(
      result === true,
      "Cryptographic verification failed"
    );

    return true;
  }

  return {
    verify,
    destroy: () => api.destroy()
  };
}
