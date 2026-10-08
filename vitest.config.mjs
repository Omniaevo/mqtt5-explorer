import { defineConfig } from "vitest/config";

// Pure-logic tests only (D14): no Electron, no DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "scripts/**/*.test.js"],
  },
});
