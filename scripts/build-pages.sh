#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

printf '\n◆ PUBLIC MANIFEST AUDIT\n'

python3 - <<'PY'
import json
import hashlib
import base64
from pathlib import Path

root = Path("prover/browser")

manifest = json.loads(
    (root / "manifest.json").read_text()
)

digest = hashlib.sha256(
    (root / "circuit.json").read_bytes()
).hexdigest()

assert digest == manifest["circuitSha256"]
assert len(manifest["challenges"]) == 5

assert set(manifest) == {
    "version", "game", "circuitSha256",
    "provingSystem", "verifierTarget", "challenges"
}

for c in manifest["challenges"]:
    assert set(c) == {
        "id", "name", "commitment", "registration"
    }

    r = c["registration"]

    assert set(r) == {"proof", "publicInputs"}

    assert r["publicInputs"] == [
        str(c["id"]),
        c["commitment"],
        "25",
        "0"
    ]

    assert len(
        base64.b64decode(r["proof"], validate=True)
    ) == 14656

print("CIRCUIT_HASH: PASS")
print("PUBLIC_REGISTRATIONS: 5")
print("PRIVATE_WITNESSES: NONE")
print("PROBE_RESPONSES: NONE")
PY

printf '\n◆ BUILD BROWSER VERIFIER\n'

pnpm --dir prover exec vite build

rm -rf _site
mkdir -p _site/tic-tac-toe _site/hunt _site/zk-check

cp index.html logo.png _site/
cp tic-tac-toe/index.html _site/tic-tac-toe/

cp hunt/index.html \
   hunt/style.css \
   hunt/app.mjs \
   hunt/engine.mjs \
   hunt/zk-session.mjs \
   _site/hunt/

cp -R prover/browser/dist/. _site/zk-check/

# Local diagnostics are not a public game.
rm -f _site/zk-check/index.html

test -s _site/zk-check/assets/game-verifier.js

python3 - <<'PY'
from pathlib import Path

root = Path("_site")

for p in root.rglob("*"):
    assert not p.is_symlink(), "Unexpected symlink"

    if p.is_file():
        assert p.name not in {
            "witness-vault.json",
            "responses.json",
            "kv-import.json",
            "Prover.toml",
            "Verifier.toml"
        }

        assert not p.name.endswith(".local.json")
        assert not p.name.startswith(".env")

print("PUBLIC_ARTIFACT_AUDIT: PASS")
PY

printf '\n◆ RELEASE SIZE\n'
du -sh _site

printf '\nPAGES_BUILD: PASS\n'
