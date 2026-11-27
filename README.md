# Tacit Tactics

An unofficial Tacit-inspired privacy arcade.

**Play:** https://0xterricola.github.io/tacit-tactics/

## Games

- Tic-Tac-Toe: classic gameplay and SHA-256 game receipts.
- Tacit Hunt: five committed secret boards, with independently
  verified zero-knowledge hit/miss proofs.

## Cryptography

Tacit Hunt uses Noir, Poseidon2 commitments and Barretenberg
UltraHonk proofs. Each probe is verified in the browser before
the game state advances.

## Architecture

- GitHub Pages: frontend and browser verifier.
- Cloudflare Workers: challenge API.
- Workers KV: precomputed probe responses.
- Durable Objects: atomic session state and probe budgets.
- Offline witness storage: never published.

## Development

Install dependencies:

    pnpm --dir prover install --frozen-lockfile
    pnpm --dir worker install --frozen-lockfile

Run gameplay tests:

    node --test hunt/tests/engine.test.mjs

Build the public website:

    bash scripts/build-pages.sh

GitHub Actions publishes the allowlisted `_site` directory.

## Limitations

No wallet, real funds or on-chain settlement is required.
Tic-Tac-Toe receipts are hash commitments, not ZK proofs.
Tacit Hunt proofs establish response correctness, not player
skill or globally enforced probe limits.

Fixed challenges remain susceptible to repeated probing
and answer sharing across sessions.

The application uses a hosted challenge API and may retrieve
public cryptographic reference data from Aztec infrastructure.

Not affiliated with or endorsed by Tacit Finance.
