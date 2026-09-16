import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration specs hit a server on NEXT_TEST_BASE_URL and are opt-in.
    exclude: ["tests/integration/**", "node_modules/**"],
  },
});
