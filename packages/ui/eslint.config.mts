import { composeConfig } from "@infra-x/eslint-config";
import type { Linter } from "eslint";

const config: Linter.Config[] = composeConfig({
  stylistic: false,
  unicorn: false,
});
export default config;
