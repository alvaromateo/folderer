import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      obsidian: resolve(__dirname, "test/__mocks__/obsidian.ts"),
    },
  },
});
