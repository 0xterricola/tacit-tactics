import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(
    new URL("./browser/", import.meta.url)
  ),
  base: "./",
  publicDir: false,
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  optimizeDeps: {
    exclude: ["@aztec-foundation/bb.js"]
  },
  build: {
    target: "esnext",
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        diagnostics: fileURLToPath(
          new URL("./browser/index.html", import.meta.url)
        ),
        "game-verifier": fileURLToPath(
          new URL("./browser/verifier.mjs", import.meta.url)
        )
      },
      output: {
        entryFileNames: chunk =>
          chunk.name === "game-verifier"
            ? "assets/game-verifier.js"
            : "assets/[name]-[hash].js"
      }
    },

    chunkSizeWarningLimit: 6000,
    outDir: "dist"
  },
  worker: {
    format: "es"
  }
});
