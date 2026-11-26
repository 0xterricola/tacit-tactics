# Tacit Tactics

Unofficial fan-made tic-tac-toe arcade inspired by [Tacit Finance](https://tacit.finance/). Logo artwork is taken from the supplied Tacit branding reference; no affiliation or endorsement is implied.

## Run

Open `index.html` in a browser. For the cryptographic receipt and clipboard functionality, use an HTTPS site or localhost (e.g. `python3 -m http.server 8000`). No dependencies or build step.

## GitHub Pages

Create a public repository `tacit-tactics`, upload the contents of this directory to the root of `main`, then select Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save. Use the Pages URL GitHub displays.

## Privacy and limitations

No wallet, funds, network calls from game code, analytics, cookies, or persistent game storage. The host may log page requests. External links are optional. The shielded board is a memory challenge, not cryptographic secrecy. The SHA-256 receipt commits to a salted move transcript and verifies legal play; it is not a ZK proof, signature, timestamp, proof of identity, or on-chain settlement. A prior independently shared hash is needed to establish consistency with an earlier commitment. Revealing a receipt reveals every move. No real protocol transactions occur.

Protocol references: [Tacit](https://tacit.finance/), [source](https://github.com/z0r0z/tacit), [builder docs](https://tacit.finance/build/).
