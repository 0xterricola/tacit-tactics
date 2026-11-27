import {
  SIZE,
  ASSETS,
  initialState,
  applyProbe,
  practiceOpponent
} from "./engine.mjs";

import {
  openChallenge
} from "./zk-session.mjs";

const $ = id => document.getElementById(id);

const productionApi =
  "https://tacit-hunt-api.station-tech.workers.dev/api";

const isLocal =
  ["localhost", "127.0.0.1"].includes(location.hostname)
  && location.port === "8787";

const isProduction =
  location.origin === "https://0xterricola.github.io";

const remoteTest =
  new URLSearchParams(location.search).get("remote") === "1";

const apiAvailable = isLocal || isProduction;

const apiBase =
  isProduction || (isLocal && remoteTest)
    ? productionApi
    : "/api";


const buttons = [
  ...document.querySelectorAll("[data-challenge]")
];

let state = initialState();
let opponent;
let challenge = null;
let mode = "practice";
let busy = false;
let failed = false;
let error = "";
let progress = "";
let verification = "Practice only";
let verifierPromise;

function coordinate(index) {
  return String.fromCharCode(65 + index % SIZE)
    + (Math.floor(index / SIZE) + 1);
}

async function getVerifier() {
  if (!verifierPromise) {
    verifierPromise = (async () => {
      const module = await import(
        "../zk-check/assets/game-verifier.js"
      );

      return {
        manifest: module.manifest,
        verifier: await module.createVerifier()
      };
    })().catch(error => {
      verifierPromise = undefined;
      throw error;
    });
  }

  return verifierPromise;
}

async function post(path, body) {
  const response = await fetch(
    apiBase + path,
    {
      method: "POST",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok)
    throw Error(`Challenge API: HTTP ${response.status}`);

  return response.json();
}

function render() {
  const zk = mode === "zk";

  $("defenderName").textContent =
    zk ? "Terricola" : "Computer";

  $("restart").textContent =
    zk ? "Switch to computer practice"
       : "New computer practice round";

  $("challengeAvailability").textContent =
    apiAvailable
      ? "Choose one of Terricola’s five secret boards."
      : "Private challenge service is not connected.";


  $("hits").textContent = `${state.hits}/${ASSETS}`;
  $("remaining").textContent = state.remaining;
  $("proofCount").textContent =
    zk ? state.probes.length : "—";

  $("modeLabel").textContent = zk
    ? `ZK CHALLENGE / ${challenge?.name || "INITIALIZING"}`
    : "PRACTICE MODE";

  $("status").textContent = error ||
    (busy
      ? progress
      : state.status === "won"
        ? "Victory — all assets recovered."
        : state.status === "lost"
          ? "Challenge failed — probes exhausted."
          : "Probe a square to discover hidden assets.");

  $("opponentLabel").textContent =
    zk ? "Terricola" : "Local machine";

  $("boardLabel").textContent =
    zk ? "Private committed board" : "Browser memory";

  $("systemLabel").textContent =
    zk ? "UltraHonk / Noir" : "Not connected";

  $("commitmentLabel").textContent =
    challenge?.commitment || "Not generated";

  $("verification").textContent = verification;

  $("verification").className = failed
    ? "failed"
    : zk && opponent
      ? "verified"
      : "";

  $("proofDescription").textContent = zk
    ? "The browser verifies each proof against the pinned commitment."
    : "Practice responses are not cryptographic proofs.";

  for (const button of buttons) {
    button.disabled = busy || !apiAvailable;

    button.setAttribute(
      "aria-pressed",
      String(
        zk &&
        Number(button.dataset.challenge) === challenge?.id
      )
    );
  }

  $("restart").disabled = busy;

  $("board").replaceChildren(
    ...Array.from({length: SIZE * SIZE}, (_, index) => {
      const probe = state.probes.find(
        p => p.index === index
      );

      const cell = document.createElement("button");

      cell.className = "cell";
      cell.disabled = busy || failed || !opponent ||
        state.status !== "active" || Boolean(probe);

      if (probe?.hit) {
        cell.classList.add("hit");

        const img = document.createElement("img");
        img.src = "../logo.png";
        img.alt = "";
        cell.append(img);

      } else if (probe) {
        cell.classList.add("miss");
        cell.textContent = "×";
      } else {
        cell.textContent = "?";
      }

      cell.setAttribute(
        "aria-label",
        `${coordinate(index)}, ${
          probe
            ? probe.hit ? "hit" : "miss"
            : "unexplored"
        }`
      );

      cell.onclick = () => probeSquare(index);

      return cell;
    })
  );

  const events = state.probes.map((probe, i) => {
    const row = document.createElement("div");
    row.className = `event ${probe.hit ? "hit" : "miss"}`;

    const square = document.createElement("span");
    square.textContent =
      `${String(i + 1).padStart(2, "0")} / ${
        coordinate(probe.index)
      }`;

    const result = document.createElement("span");

    result.textContent =
      (probe.hit ? "HIT" : "MISS") +
      (zk ? " · ZK ✓" : "");

    row.append(square, result);
    return row;
  }).reverse();

  $("history").replaceChildren(...events);

  if (!events.length)
    $("history").textContent = "Awaiting first probe.";
}

async function startChallenge(id) {
  if (busy || !apiAvailable) return;

  busy = true;
  failed = false;
  error = "";
  opponent = undefined;
  challenge = null;
  mode = "zk";
  state = initialState();

  progress = "Initializing zero-knowledge verifier…";
  verification = "Registration pending";

  render();

  try {
    const context = await getVerifier();

    challenge = context.manifest.challenges.find(
      c => c.id === id
    );

    if (!challenge)
      throw Error("Unknown committed challenge");

    progress = "Verifying board registration…";
    render();

    opponent = await openChallenge({
      challenge,
      verifier: context.verifier,
      post
    });

    verification = "✓ Board registration verified";

  } catch (e) {
    failed = true;
    error = `Challenge unavailable: ${e.message}`;
    verification = "Initialization failed";
  } finally {
    busy = false;
    render();
  }
}

async function probeSquare(index) {
  if (busy || failed || !opponent ||
      state.status !== "active" ||
      state.probes.some(p => p.index === index))
    return;

  busy = true;
  error = "";

  progress = mode === "zk"
    ? "Verifying zero-knowledge proof…"
    : "Awaiting response…";

  render();

  try {
    const start = performance.now();

    const response = await opponent.probe(index);

    if (response.index !== index ||
        response.mode !== mode)
      throw Error("Invalid probe response");

    if (mode === "zk" &&
        response.verified !== true)
      throw Error("Unverified probe");

    state = applyProbe(
      state, index, response.hit
    );

    const elapsed = Math.round(
      performance.now() - start
    );

    verification = mode === "zk"
      ? `✓ ${coordinate(index)} verified · ${elapsed} ms`
      : `${coordinate(index)} — unproved`;

  } catch (e) {
    error = `Probe rejected: ${e.message}`;

    if (mode === "zk") {
      failed = true;
      verification = "Proof or session rejected";
      error += " — select a challenge to restart.";
    }
  } finally {
    busy = false;
    render();
  }
}

function restart() {
  if (busy) return;

  mode = "practice";
  challenge = null;
  failed = false;
  error = "";
  state = initialState();
  opponent = practiceOpponent();
  verification = "Practice only";

  render();
}

for (const button of buttons) {
  button.onclick = () =>
    startChallenge(Number(button.dataset.challenge));
}

$("restart").onclick = restart;

restart();
