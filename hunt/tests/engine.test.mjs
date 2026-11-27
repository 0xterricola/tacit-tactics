import test from "node:test";
import assert from "node:assert/strict";

import {
  placements,
  validBoard,
  randomBoard,
  initialState,
  applyProbe,
  practiceOpponent
} from "../engine.mjs";

test("28 legal placements", () => {
  assert.equal(placements().length, 28);
  assert.equal(
    new Set(placements().map(x => x.join(","))).size,
    28
  );
});

test("all generated boards are valid", () => {
  for (const board of placements())
    assert.equal(validBoard(board), true);

  for (let i = 0; i < 100; i++)
    assert.equal(validBoard(randomBoard()), true);
});

test("reject illegal boards", () => {
  for (const board of [
    [],
    [0, 1, 2, 5],
    [0, 0, 1, 2],
    [22, 23, 24, 25],
    [0, 1, 2, "3"]
  ]) {
    assert.equal(validBoard(board), false);
  }
});

test("four hits produce victory", () => {
  let state = initialState();

  for (const i of [0, 6, 12, 18])
    state = applyProbe(state, i, true);

  assert.equal(state.hits, 4);
  assert.equal(state.remaining, 8);
  assert.equal(state.status, "won");
});

test("twelve misses produce defeat", () => {
  let state = initialState();

  for (let i = 0; i < 12; i++)
    state = applyProbe(state, i, false);

  assert.equal(state.status, "lost");
  assert.equal(state.remaining, 0);
});

test("reject duplicate probes", () => {
  const state = applyProbe(initialState(), 0, true);

  assert.throws(() => applyProbe(state, 0, true));
});

test("reject invalid responses", () => {
  for (const index of [-1, 25, 1.5, "2"])
    assert.throws(
      () => applyProbe(initialState(), index, true)
    );

  assert.throws(
    () => applyProbe(initialState(), 0, "true")
  );
});

test("practice opponent answers accurately", async () => {
  const opponent = practiceOpponent([0, 6, 12, 18]);

  for (let i = 0; i < 25; i++) {
    const answer = await opponent.probe(i);

    assert.equal(answer.index, i);
    assert.equal(
      answer.hit,
      [0, 6, 12, 18].includes(i)
    );
    assert.equal(answer.proof, null);
    assert.equal(answer.mode, "practice");
  }
});

test("terminal states reject further probes", () => {
  let state = initialState();

  for (const i of [0, 1, 2, 3])
    state = applyProbe(state, i, true);

  assert.throws(() => applyProbe(state, 4, false));
});

test("state transitions are immutable", () => {
  const before = initialState();
  const after = applyProbe(before, 0, true);

  assert.equal(before.probes.length, 0);
  assert.equal(after.probes.length, 1);
});
