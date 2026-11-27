export const SIZE = 5;
export const ASSETS = 4;
export const PROBE_LIMIT = 12;

export function placements() {
  const lines = [];
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1]
  ];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const [dr, dc] of directions) {
        const line = [];

        for (let k = 0; k < ASSETS; k++) {
          const y = r + k * dr;
          const x = c + k * dc;

          if (y < 0 || y >= SIZE ||
              x < 0 || x >= SIZE) break;

          line.push(y * SIZE + x);
        }

        if (line.length === ASSETS) {
          lines.push(line);
        }
      }
    }
  }

  return lines;
}

export function validBoard(board) {
  if (!Array.isArray(board) ||
      board.length !== ASSETS ||
      new Set(board).size !== ASSETS ||
      !board.every(Number.isInteger)) {
    return false;
  }

  return placements().some(
    line => line.every(i => board.includes(i))
  );
}

export function randomBoard() {
  const options = placements();
  const bytes = new Uint8Array(1);
  const limit = 256 - (256 % options.length);

  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);

  return options[bytes[0] % options.length];
}

export function initialState() {
  return {
    probes: [],
    hits: 0,
    remaining: PROBE_LIMIT,
    status: "active"
  };
}

export function applyProbe(state, index, hit) {
  if (state.status !== "active")
    throw Error("Challenge already finished");

  if (!Number.isInteger(index) ||
      index < 0 || index >= SIZE * SIZE)
    throw Error("Invalid square");

  if (typeof hit !== "boolean")
    throw Error("Invalid probe response");

  if (state.probes.some(p => p.index === index))
    throw Error("Square already probed");

  const hits = state.hits + Number(hit);
  const remaining = state.remaining - 1;

  return {
    probes: [...state.probes, {index, hit}],
    hits,
    remaining,
    status: hits === ASSETS
      ? "won"
      : remaining === 0
        ? "lost"
        : "active"
  };
}

// Practice-only opponent.
// Never use this for a private public challenge.
export function practiceOpponent(
  board = randomBoard()
) {
  if (!validBoard(board))
    throw Error("Invalid secret board");

  const secret = new Set(board);

  return Object.freeze({
    async probe(index) {
      if (!Number.isInteger(index) ||
          index < 0 || index >= SIZE * SIZE)
        throw Error("Invalid square");

      return {
        index,
        hit: secret.has(index),
        proof: null,
        mode: "practice"
      };
    }
  });
}
