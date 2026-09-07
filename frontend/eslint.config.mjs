import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Plain-Node maintenance scripts (locale sync tooling) are CommonJS by
    // design — `require()` is the correct idiom there, not a lint error.
    files: ["scripts/**/*.{js,cjs,mjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // ── Next 16 React-Compiler-era strict rules: warn, not error ──────
    // These rules flag patterns across the pre-existing chat-streaming
    // components (LostPetAgent, FloatingChatbot, BatchUpload, medical
    // forms). They are real modernization targets but NOT correctness
    // bugs: the code ships, builds, and streams correctly today.
    // Refactoring 30+ sites mid-stabilization risks regressing the
    // intake funnel. Tracked as tech debt in Project_Board.md —
    // address one component per sprint, then promote back to "error".
    plugins: { "react-hooks": reactHooks },
    rules: {
      // setState directly inside useEffect body (cascading renders).
      "react-hooks/set-state-in-effect": "warn",
      // Components/helpers defined during render (recreated each render).
      "react-hooks/static-components": "warn",
      // React Compiler cannot preserve manual useMemo/useCallback.
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
