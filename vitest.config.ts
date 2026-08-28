import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 65,
        functions: 85,
        lines: 80,
        statements: 80,
      },
    },
    environment: "node",
    restoreMocks: true,
  },
});
