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
        },
      },
      {
        resolve: { alias },
        plugins: [
          lingui(),
          // Turns every story into a test case: it renders, its play function
          // runs, and anything thrown fails the run.
          storybookTest({ configDir: join(rootDir, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          setupFiles: [join(rootDir, '.storybook/vitest.setup.ts')],
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
