import { react, nextjs, vitest, tailwind } from "@infra-x/code-quality/lint";
import { defineConfig } from "oxlint";
import rootConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [
    rootConfig,
    react(),
    nextjs(),
    tailwind({
      entryPoint: "src/styles/globals.css",
      rootFontSize: 16,
    }),
    vitest({ files: ["**/*.test.ts", "**/*.test.tsx"] }),
  ],
  ignorePatterns: [".agents/**", ".next/**", "src/components/ai-elements/**"],
  overrides: [
    {
      // base() preset force-enables this for GLOB_SRC. Override in same scope to disable.
      // Feature-internal relative imports (`../types`, `../hooks/...`) are the
      // bulletproof-react convention; cross-feature imports use `@/` alias instead.
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      rules: {
        "import/no-relative-parent-imports": "off",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      rules: {
        "vitest/no-conditional-in-test": "off",
        "jest/no-conditional-in-test": "off",
        "typescript/require-await": "off",
        "typescript/unbound-method": "off",
        "typescript/strict-void-return": "off",
      },
    },
  ],
});
