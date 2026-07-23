import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react-swc'
import { playwright } from '@vitest/browser-playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = dirname(fileURLToPath(import.meta.url))

// The lingui macros (`t`, `msg`, `Trans`) are compile-time transforms. Without
// this plugin any module importing them throws at runtime — even a test that
// only touches pure helpers, because the constants module sits in its import
// graph. Both projects need it.
const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

const alias = { src: join(rootDir, 'src') }

export default defineConfig({
  resolve: { alias },
  test: {
    // `npm run test:coverage` reports across BOTH projects, so a component
    // covered only by its story still counts. Barrels, stories and fixtures are
    // excluded — they are wiring, and counting them flatters the number.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/index.ts',
        'src/**/*.stories.tsx',
        'src/**/*.test.ts',
        'src/locales/**',
        'src/shared/story-fixtures/**',
        // Docs-only helpers (used from `.mdx`, which coverage does not see).
        'src/shared/story-docs/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
    },
    // Two projects rather than one root config. `include` and `environment` at
    // the root would leak into the Storybook project through `extends`, and the
    // plugin then discards them with a warning — the unit tests would silently
    // stop running.
    projects: [
      {
        resolve: { alias },
        plugins: [lingui()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          // Installs a real IndexedDB implementation over the global and empties
          // it between cases, so the data layer can be tested for what it
          // actually does rather than against a mocked Dexie.
          setupFiles: [join(rootDir, 'src/test-setup.ts')],
        },
      },
      {
        resolve: { alias },
        plugins: [
          lingui(),
          // Turns every story into a test case: it renders, its play function
          // runs, and anything thrown fails the run.
          //
          // The report's PDF path (pdfkit under Node shims) is NOT exercised as a
          // browser test here: pdfkit needs Buffer/stream/zlib/fs, and adding the
          // polyfill plugin to this project also rewrites Storybook's own
          // `node:fs` imports and breaks the runner's bundle. The path is covered
          // by Node tests (`bidiText.test.ts`, `renderCertificatePdf.test.ts`) and
          // verified by hand in the dev server. See TECH-DEBT.md entry 6.
          storybookTest({ configDir: join(rootDir, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          // Story files run ONE AT A TIME.
          //
          // They all share a single IndexedDB — it is the browser's, keyed by
          // origin, not per-worker state that isolation could separate. So a
          // file seeding fixtures runs alongside one wiping the database for a
          // backup test, and whichever asserts on row counts loses. That
          // produced a suite which passed and failed on alternate runs with no
          // code change, which is worse than a suite that simply fails.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
