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
    // Build and tooling scripts run under Node, not in the browser, so they get
    // Node's globals instead of the browser set every `src` file uses.
    files: ['scripts/**/*.mjs', 'src/pwa/icons/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
      // Type information lets `lingui/no-unlocalized-strings` skip any string
      // assigned to a union type — MUI prop unions, sx values and our own
      // enums — which is what keeps the rule to real copy instead of noise.
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
      // Every user-facing string goes through lingui. This is the real rule —
      // it catches ANY unlocalized string, not just Persian ones, so writing a
      // bare English label fails exactly the same way.
      'lingui/no-unlocalized-strings': [
        'error',
        {
          useTsTypes: true,
          // Strings with no letters at all (ids, hex, symbols, format patterns)
          // and single lowercase tokens are never user-facing copy.
          ignore: [
            // No letters at all: ids, hex colours, symbols, format patterns.
            '^[^A-Za-z]*$',
            '^[a-z0-9_.:/#-]+$',
            // BCP-47 locale tags, brand and format constants.
            '^[a-z]{2}-[A-Z]{2}$',
            // `DN` is the certificate's reference prefix — an identifier
            // printed verbatim on the document, not copy to be translated.
            '^(Vazirmatn|Daramadname|DN|A4|TOMAN|USD|USDT|JALALI|GREGORIAN)$',
            // Asset filenames.
            '[.](ttf|woff2?|json|png|svg|pdf)$',
            // Dexie index declarations: 'id, occurredAt, clientId'.
            '^[&A-Za-z0-9_]+(, ?[&A-Za-z0-9_.]+)+$',
            // CSS values: '1px solid #fff', 'blur(16px)', 'rgba(0,0,0,.18)'.
            '(px|rem|em|%)\\b|^(blur|rgba?|hsla?|var|calc|url)\\(|\\b(solid|dashed|none|auto|inherit)\\b',
          ],
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
            'title$',
            // pdfmake table layout preset, not copy.
            'layout',
            // Data keys and library config, never rendered to a user.
            'field',
            'pageSize',
            'font',
            'author',
            'alignment',
            'severity',
          ],
          ignoreFunctions: [
            'console.*',
            'i18n._',
            'import',
            'require',
            // Developer-facing throw sites: these never reach a user, they
            // fail before React mounts or indicate a programming bug.
            'Error',
            '*.addEventListener',
            '*.querySelector',
            '*.getElementById',
            '*.toLocaleString',
            // Dexie query builders take index names, not copy.
            '*.stores',
            '*.where',
            '*.equals',
            '*.orderBy',
            'version',
            // date-fns format patterns ('yyyy/MM/dd') are syntax, not copy.
            'format',
            'formatJalali',
            'formatGregorian',
            // `patch(key, value)` takes a form-state key.
            'patch',
            // CSS media query strings are syntax, not copy.
            'useMediaQuery',
          ],
          ignoreMethodsOnTypes: ['Map.get', 'Map.has', 'Set.has'],
        },
      ],
      'lingui/t-call-in-function': 'error',
      'lingui/no-single-variables-to-translate': 'error',
      // Off deliberately. It guards against message ids that shift when an
      // expression changes, but every interpolation here is a number or an
      // already-formatted date, and they extract as stable {0}/{1} placeholders
      // that translators can reorder freely.
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
    // Storybook config sits outside the app's tsconfig project graph, so it is
    // linted without type information and without the localisation rule.
    files: ['.storybook/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': 'off',
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
    // Stories are exempt from the barrel rules, and from localisation: story
    // args are plain objects evaluated outside any React context, and a story
    // exists to show one concrete rendering.
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'lingui/no-unlocalized-strings': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Story fixtures are sample data for Storybook only — never bundled into
    // the app, and not user-facing copy. Same reasoning as the stories that
    // consume them.
    files: ['src/shared/story-fixtures/**'],
    rules: {
      'lingui/no-unlocalized-strings': 'off',
    },
  },
  {
    // Tests assert on concrete rendered output, so their literals are expected
    // values rather than user-facing copy.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'lingui/no-unlocalized-strings': 'off',
    },
  },
  {
    // `digits.ts` holds the Persian and Arabic-Indic codepoint tables that the
    // normalisation algorithm maps between. These are character data, not copy;
    // routing them through a catalog would be meaningless and would break the
    // conversion.
    files: ['src/shared/utils/digits.ts'],
    rules: {
      'lingui/no-unlocalized-strings': 'off',
    },
  },
  prettierRecommended,
  ...storybook.configs['flat/recommended'],
)
