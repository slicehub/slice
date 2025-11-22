import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ["buffer"],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      wasm(),
    ],
    resolve: {
      alias: {
        slice: path.resolve(__dirname, "./packages/slice/dist/index.js"),
        "guess_the_puzzle": path.resolve(__dirname, "./packages/guess_the_puzzle/dist/index.js"),
      },
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      exclude: [
        "@stellar/stellar-xdr-json",
        "@noir-lang/noir_wasm",
        "@noir-lang/noirc_abi",
        "@noir-lang/acvm_js",
        "@noir-lang/noir_js",
        "@aztec/bb.js",
      ],
    },
    assetsInclude: ["**/*.wasm"],
    define: {
      global: "globalThis",
      "process.env": "{}",
    },
    envPrefix: "PUBLIC_",
    server: {
      headers: {
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
      proxy: {
        "/friendbot": {
          target: "http://localhost:8000/friendbot",
          changeOrigin: true,
        },
      },
    },
  };
});
