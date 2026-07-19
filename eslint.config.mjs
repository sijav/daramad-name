import js from '@eslint/js'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'node_modules',
      'src/locales/**/messages.ts',
      'src/locales/**/messages.d.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'lingui.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // This project has no GraphQL fragment colocation, so the rule is back on —
      // constant exports (label maps, option lists) stay allowed.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Browser globals go through `window.*`, which keeps them mockable and greppable.
      'no-restricted-globals': [
        'error',
        'document',
        'location',
        'navigator',
        'localStorage',
        'sessionStorage',
        'fetch',
        'crypto',
        'btoa',
        'atob',
        'Blob',
      ],
      // Every user-facing string must go through lingui. The `t` and `msg`
      // macros are tagged template literals and `<Trans>` wraps JSX text, so
      // anything Persian left in a plain string literal or bare JSX text has
      // escaped translation. Comments are not AST literals and are unaffected.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[\\u0600-\\u06FF]/]',
          message: 'Persian string literal must go through lingui — use the t`` macro (or msg`` outside components).',
        },
        {
          // Any Trans ANCESTOR counts, not just a direct parent — nesting an
          // inline element inside <Trans> (a link, <strong>) is idiomatic lingui.
          selector: "JSXText[value=/[\\u0600-\\u06FF]/]:not(JSXElement[openingElement.name.name='Trans'] JSXText)",
          message: 'Persian JSX text must be wrapped in <Trans>…</Trans>.',
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw=/[\\u0600-\\u06FF]/]:not(TaggedTemplateExpression > TemplateLiteral)',
          message: 'Persian template literal must be tagged with the t`` or msg`` macro.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@mui/material/*', '!@mui/material/locale', '@mui/system/*', '@mui/lab/*'],
              message: 'Import from the @mui/material (or @mui/system) barrel only. Exception: @mui/material/locale.',
            },
            {
              group: ['../*'],
              message: 'Relative parent imports are not allowed — use absolute `src/...` paths.',
            },
            {
              group: [
                'src/shared/*/*',
                '!src/shared/types/*',
                '!src/shared/types/*/*',
                '!src/shared/layouts/*',
                '!src/shared/utils/*',
                'src/core/*/*',
              ],
              message:
                'Cross-module imports must target the folder barrel (index.ts), e.g. `src/shared/money-text` — not a file inside it. Exceptions: types/*, layouts/*, utils/*.',
            },
          ],
          paths: [
            {
              name: '.',
              message: 'Do not import from "." — point at the file in the same folder, e.g. "./Component".',
            },
          ],
        },
      ],
    },
  },
  {
    // Module augmentation must target MUI's real module path — the barrel
    // re-exports the types but `declare module` has to name the file that
    // declares them.
    files: ['**/*.d.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Stories are exempt from the barrel rules. They are also exempt from the
    // lingui rule: story args are plain objects evaluated outside any React
    // context, and a story exists to show a concrete rendering — a message id
    // resolved through a catalog would defeat the point.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Tests assert on concrete rendered output, so their Persian literals are
    // expected values, not user-facing copy.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // `digits.ts` holds the Persian and Arabic-Indic codepoint tables that the
    // normalisation algorithm maps between. These are character data, not copy;
    // routing them through a translation catalog would be meaningless and would
    // break the conversion.
    files: ['src/shared/utils/digits.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  prettierRecommended,
  ...storybook.configs['flat/recommended'],
)
