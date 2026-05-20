import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/unit/**/*.test.ts"],
    exclude: ["test/integration/**"],
    environment: "node",
    coverage: {
      reporter: ["text", "json-summary", "json"],
    },
  },
  resolve: {
    alias: {
      obsidian: resolve(__dirname, "test/unit/__mocks__/obsidian.ts"),
    },
  },
});
