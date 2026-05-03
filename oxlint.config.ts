import { base, typeAware, unicorn, depend } from '@infra-x/code-quality/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), typeAware(), unicorn(), depend()],
  ignorePatterns: ['packages/icons/**', 'packages/ui/**'],
  rules: {
    // TypeScript's type checker already validates narrowed assertions; this rule
    // produces false positives on guarded casts (e.g. after typeof/Array.isArray checks).
    'typescript/no-unsafe-type-assertion': 'off',
    // Both rules fire on JSX event handlers (onClick/onSubmit accept () => void
    // but receive async fns). tsgolint's variants don't support the
    // `checksVoidReturn: { attributes: false }` option that lets ESLint scope
    // these to non-JSX contexts. The wrapper-everywhere alternative is noisy.
    'typescript/no-misused-promises': 'off',
    'typescript/strict-void-return': 'off',
    // Conflicts with `consistent-return`, which requires explicit `return undefined`
    // when other branches return values. Prefer the consistency rule.
    'unicorn/no-useless-undefined': 'off',
  },
})
