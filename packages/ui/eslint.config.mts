import { composeConfig } from "@workspace/eslint-config";
import type { Linter } from "eslint";

const config: Linter.Config[] = composeConfig({
  stylistic: false,
  unicorn: false,
});
export default config;
