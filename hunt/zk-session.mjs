import {
  SIZE,
  PROBE_LIMIT,
  initialState,
  applyProbe
} from "./engine.mjs";

function require(condition, message) {
  if (!condition) throw Error(message);
}

export async function openChallenge({
  challenge,
  verifier,
  post
}) {
  // Registration must be independently verified
  // before opening a gameplay session.
  require(
    await verifier.verify(
      challenge,
      25,
      false,
      challenge.registration
    ) === true,
    "Registration proof rejected"
  );

  const session = await post("/session", {
    challengeId: challenge.id
  });

  require(
    session.challengeId === challenge.id &&
    session.remaining === PROBE_LIMIT &&
    typeof session.sessionId === "string" &&
    /^[a-f0-9]{64}$/.test(session.sessionId),
    "Invalid session"
  );

  let state = initialState();
  let pending = false;
  let invalidated = false;

  return Object.freeze({
    async probe(square) {
      require(!invalidated, "Session invalidated");
      require(!pending, "Probe already pending");
      require(
        state.status === "active",
        "Challenge finished"
      );

      require(
        Number.isInteger(square) &&
        square >= 0 && square < SIZE * SIZE &&
        !state.probes.some(p => p.index === square),
        "Invalid or duplicate probe"
      );

      pending = true;

      try {
        const response = await post("/probe", {
          sessionId: session.sessionId,
          square
        });

        require(
          response.challengeId === challenge.id &&
          response.commitment === challenge.commitment &&
          response.square === square &&
          typeof response.hit === "boolean",
          "Response binding mismatch"
        );

        require(
          await verifier.verify(
            challenge,
            square,
            response.hit,
            response
          ) === true,
          "Probe proof rejected"
        );

        const next = applyProbe(
          state,
          square,
          response.hit
        );

        require(
          response.remaining === next.remaining &&
          response.status === next.status,
          "Session state mismatch"
        );

        // Commit state only after all checks pass.
        state = next;

        return {
          index: square,
          hit: response.hit,
          mode: "zk",
          verified: true,
          proof: response.proof
        };

      } catch (error) {
        // The server may have consumed this probe.
        // Never continue a potentially divergent session.
        invalidated = true;
        throw error;
      } finally {
        pending = false;
      }
    }
  });
}
