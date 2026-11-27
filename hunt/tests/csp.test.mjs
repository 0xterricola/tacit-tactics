import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("production CSP matches bundled verifier CRS origins", () => {
  const html = readFileSync(
    new URL("../../_site/hunt/index.html", import.meta.url),
    "utf8"
  );
  const bundle = readFileSync(
    new URL("../../_site/zk-check/assets/game-verifier.js", import.meta.url),
    "utf8"
  );

  const policy = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
  )?.[1];
  assert.ok(policy, "production Hunt CSP is missing");

  const connectSrc = policy.split(";").map(value => value.trim())
    .find(value => value.startsWith("connect-src "));
  assert.ok(connectSrc, "production Hunt connect-src is missing");

  const bundledOrigins = [...new Set(
    bundle.match(/https:\/\/crs\.[a-z0-9.-]+/g) ?? []
  )].sort();
  const allowedOrigins = connectSrc.split(/\s+/)
    .filter(value => value.startsWith("https://crs."))
    .sort();

  assert.deepEqual(bundledOrigins, [
    "https://crs.aztec-cdn.foundation",
    "https://crs.aztec-labs.com"
  ]);
  assert.deepEqual(allowedOrigins, bundledOrigins);
  assert.ok(!connectSrc.includes("https://crs.aztec.network"));
});
