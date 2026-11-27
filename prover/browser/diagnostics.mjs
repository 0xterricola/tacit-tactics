import {
  manifest,
  createVerifier
} from "./verifier.mjs";

const $ = id => document.getElementById(id);

function log(message) {
  $("log").textContent += message + "\n";
}

function require(condition, message) {
  if (!condition) throw Error(message);
}

async function post(path, body) {
  const response = await fetch(path, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  require(
    response.ok,
    `API returned HTTP ${response.status}`
  );

  return response.json();
}

async function reject(label, fn) {
  let rejected = false;

  try {
    await fn();
  } catch {
    rejected = true;
  }

  require(rejected, `${label}: accepted`);
  log(`${label}: REJECTED`);
}

async function run() {
  $("run").disabled = true;
  $("log").textContent = "";

  let verifier;

  try {
    log("M6.1 — BROWSER VERIFICATION");
    log("INITIALIZING WASM...");

    const start = performance.now();

    verifier = await createVerifier();

    log(
      `INITIALIZATION_MS: ${
        Math.round(performance.now() - start)
      }`
    );

    require(
      manifest.challenges.length === 5,
      "Unexpected challenge count"
    );

    for (const challenge of manifest.challenges) {
      await verifier.verify(
        challenge,
        25,
        false,
        challenge.registration
      );

      log(`REGISTRATION_${challenge.id}: PASS`);
    }

    const challenge = manifest.challenges[0];

    const session = await post("/api/session", {
      challengeId: challenge.id
    });

    require(
      session.challengeId === challenge.id,
      "Session challenge mismatch"
    );

    const response = await post("/api/probe", {
      sessionId: session.sessionId,
      square: 0
    });

    require(
      response.challengeId === challenge.id &&
      response.commitment === challenge.commitment &&
      response.square === 0,
      "Response mismatch"
    );

    const before = performance.now();

    await verifier.verify(
      challenge, 0, response.hit, response
    );

    log("LIVE_API_PROOF: PASS");
    log(
      `VERIFY_MS: ${
        Math.round(performance.now() - before)
      }`
    );

    await reject("WRONG_SQUARE", () =>
      verifier.verify(
        challenge, 1, response.hit, response
      )
    );

    // Change both the claimed result and its public
    // input so the cryptographic verifier must reject.
    const forged = {
      ...response,
      hit: !response.hit,
      publicInputs: [
        ...response.publicInputs
      ]
    };

    forged.publicInputs[3] =
      forged.hit ? "1" : "0";

    await reject("FORGED_HIT_FLAG", () =>
      verifier.verify(
        challenge, 0, forged.hit, forged
      )
    );

    await verifier.verify(
      challenge, 0, response.hit, response
    );

    log("POSITIVE_CONTROL: PASS");
    log("M6.1: PASS");

  } catch (error) {
    log(`ERROR: ${error.message}`);
    log("M6.1: FAIL");
  } finally {
    if (verifier) await verifier.destroy();
    $("run").disabled = false;
  }
}

$("run").onclick = run;

$("copy").onclick = () =>
  navigator.clipboard.writeText(
    $("log").textContent
  );
