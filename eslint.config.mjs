import js from '@eslint/js'
import lingui from 'eslint-plugin-lingui'
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
    // Tooling scripts run under Node, not in the browser.
    files: ['scripts/**/*.mjs', 'src/pwa/icons/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
      // Type information lets `lingui/no-unlocalized-strings` skip strings assigned to a
      // union type: MUI prop unions, sx values, our own enums.
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      lingui,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Vite's fast refresh survives a module that also exports a literal constant, so
      // the option is safe here. It covers literals only, not object or array exports.
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
      // English is the lingui source locale, so a bare English label fails this exactly
      // as a Persian one would.
      'lingui/no-unlocalized-strings': [
        'error',
        {
          useTsTypes: true,
          ignore: [
            // No letters at all: ids, hex colours, symbols, format patterns.
            '^[^A-Za-z]*$',
            // A single lowercase token.
            '^[a-z0-9_.:/#-]+$',
            // BCP-47 locale tags.
            '^[a-z]{2}-[A-Z]{2}$',
            // Brand and format constants. `DN` is the certificate's reference prefix,
            // printed verbatim on the document.
            '^(Vazirmatn|Daramadname|DN|A4|TOMAN|USD|USDT|JALALI|GREGORIAN)$',
            // Asset filenames.
            '[.](ttf|woff2?|json|png|svg|pdf)$',
            // Dexie index declarations: 'id, occurredAt, clientId'.
            '^[&A-Za-z0-9_]+(, ?[&A-Za-z0-9_.]+)+$',
            // CSS values: '1px solid #fff', 'blur(16px)', 'rgba(0,0,0,.18)'.
            '(px|rem|em|%)\\b|^(blur|rgba?|hsla?|var|calc|url)\\(|\\b(solid|dashed|none|auto|inherit)\\b',
          ],
          // A plain string here is compared with `===`. Anything pattern-shaped has to be
          // spelled out as `{ regex: ... }` or it silently matches nothing.
          ignoreNames: [
            { regex: { pattern: '^(data-|aria-(?!label))', flags: 'i' } },
            'className',
            'key',
            'id',
            'name',
            'type',
            'component',
            'to',
            'href',
            'accept',
            'fontFamily',
            'sx',
            'style',
            'format',
            'queryKey',
            'displayName',
            // Data keys and library config: the ledger sort `field`, MUI's `severity`,
            // and the PDF document model built in `buildIncomeReport.ts`.
            'field',
            'severity',
            'pageSize',
            'font',
            'author',
          ],
          ignoreFunctions: [
            'console.*',
            'i18n._',
            'import',
            'require',
            // `throw new Error('Root element not found')` in main.tsx fails before React
            // mounts, so no user reads it.
            'Error',
            // DOM APIs take event names and selectors.
            '*.addEventListener',
            '*.querySelector',
            '*.getElementById',
            // Dexie query builders take index names.
            '*.stores',
            '*.where',
            '*.equals',
            '*.orderBy',
            // date-fns format patterns ('yyyy/MM/dd') are syntax.
            'format',
            'formatJalali',
            'formatGregorian',
            // `patch(key, value)` takes a form-state key.
            'patch',
            // CSS media query strings are syntax.
            'useMediaQuery',
          ],
          ignoreMethodsOnTypes: ['Map.get', 'Map.has', 'Set.has'],
        },
      ],
      'lingui/t-call-in-function': 'error',
      'lingui/no-single-variables-to-translate': 'error',
      // Off: every interpolation here is a number or an already-formatted date, and they
      // extract as stable {0}/{1} placeholders that translators can reorder.
      'lingui/no-expression-in-message': 'off',
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
              message: 'Relative parent imports are not allowed, use absolute `src/...` paths.',
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
                'Cross-module imports must target the folder barrel (index.ts), e.g. `src/shared/money-text`, not a file inside it. Exceptions: types/*, layouts/*, utils/*.',
            },
          ],
          paths: [
            {
              name: '.',
              message: 'Do not import from ".", point at the file in the same folder, e.g. "./Component".',
            },
          ],
        },
      ],
    },
  },
  {
    // Storybook config is outside the app's tsconfig project graph, so no type
    // information here, and it imports `story-docs` files directly since that folder
    // has no barrel.
    files: ['.storybook/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // `declare module` has to name the file that declares the types, not the barrel that
    // re-exports them, so `muiPalette.d.ts` imports `@mui/material/styles`.
    files: ['**/*.d.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Five globs turn localisation off, each for its own reason: a story shows one
    // concrete rendering, a test asserts on concrete rendered output, story fixtures are
    // sample data that never reaches the app bundle, `story-docs` literals are Vite glob
    // patterns (the Persian prose it renders lives in `story-docs/fa/*.md`), and
    // `digits.ts` holds the Persian and Arabic-Indic codepoint tables, which are
    // character data the normalisation algorithm maps between.
    files: [
      '**/*.stories.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      'src/shared/story-fixtures/**',
      'src/shared/story-docs/**',
      'src/shared/utils/digits.ts',
    ],
    rules: {
      'lingui/no-unlocalized-strings': 'off',
    },
  },
  prettierRecommended,
  ...storybook.configs['flat/recommended'],
)
