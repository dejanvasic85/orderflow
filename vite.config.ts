import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const isTest = process.env.VITEST === "true";

const config = defineConfig({
  server: {
    port: 3344,
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/components/ui/**",
        "src/routeTree.gen.ts",
        "src/router.tsx",
        "src/integrations/**",
        "src/lib/database.types.ts",
        "src/**/*.d.ts",
      ],
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts"],
    sortImports: {
      groups: [
        ["type-builtin", "builtin"],
        ["type-external", "external"],
        ["type-internal", "internal"],
        ["type-parent", "type-sibling", "type-index", "parent", "sibling", "index"],
      ],
      newlinesBetween: false,
      order: "asc",
    },
  },
  lint: {
    ignorePatterns: ["src/lib/database.types.ts", "src/routeTree.gen.ts"],
    options: { typeAware: true, typeCheck: true },
  },
  plugins: [
    devtools(),
    !isTest && cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart({ router: { routeFileIgnorePattern: "\\.(test|spec)\\.(ts|tsx)$" } }),
    viteReact(),
  ].filter(Boolean),
});

export default config;
