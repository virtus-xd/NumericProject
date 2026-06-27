import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests target the from-scratch numerical library (pure functions),
// so a Node environment is sufficient — no DOM is required.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
