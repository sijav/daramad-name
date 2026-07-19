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
                'Cross-module imports must target the folder barrel (index.ts), e.g. `src/shared/score-gauge` — not a file inside it. Exceptions: types/*, layouts/*, utils/*.',
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
    // Stories are exempt from the barrel rules.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  prettierRecommended,
  ...storybook.configs['flat/recommended'],
)
