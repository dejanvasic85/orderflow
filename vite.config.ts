import { defineConfig } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const isTest = process.env.VITEST === "true";

const config = defineConfig({
  server: {
    port: 3344,
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts"],
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [
    devtools(),
    !isTest && cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ].filter(Boolean),
});

export default config;
