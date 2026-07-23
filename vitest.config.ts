import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react-swc'
import { playwright } from '@vitest/browser-playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = dirname(fileURLToPath(import.meta.url))

// `t`, `msg` and `Trans` are compile-time macros, so a module importing them
// throws at runtime without this plugin. Both projects need it: even a pure
// helper test reaches `src/shared/constants/labels.ts`, which uses `msg`.
const lingui = () => react({ plugins: [['@lingui/swc-plugin', {}]] })

const alias = { src: join(rootDir, 'src') }

export default defineConfig({
  resolve: { alias },
  test: {
    // `npm run test:coverage` reports across BOTH projects, so a component
    // covered only by its story still counts. Barrels, tests and the two
    // Storybook-only folders are wiring, and counting them flatters the number.
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
        'src/shared/story-docs/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
    },
    projects: [
      {
        resolve: { alias },
        plugins: [lingui()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          setupFiles: [join(rootDir, 'src/test-setup.ts')],
        },
      },
      {
        resolve: { alias },
        plugins: [
          lingui(),
          // No node polyfills here, unlike `vite.config.ts`: adding that plugin
          // rewrites Storybook's own `node:fs` imports and breaks the runner's
          // bundle. So the report's pdfkit path is covered by Node tests
          // (`bidiText.test.ts`, `renderCertificatePdf.test.ts`) instead. See
          // TECH-DEBT.md entry 6.
          storybookTest({ configDir: join(rootDir, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          // No `include` here: the addon collects its files from the `stories`
          // globs in `.storybook/main.ts` and ignores `test.include`, warning.
          //
          // Story files run one at a time. They share one IndexedDB, the
          // browser's, keyed by origin rather than per-worker state that
          // isolation could separate, so a file seeding fixtures races one
          // clearing the database and row-count assertions flip between runs.
          // Costs about 20 seconds. See TECH-DEBT.md entry 2.
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
