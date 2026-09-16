import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Integration suite — requires a running server (see tests/integration).
 * Kept in a separate config so `npm test` stays hermetic and offline.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    // Sequential: several assertions exercise shared rate-limit buckets.
    fileParallelism: false,
  },
});
