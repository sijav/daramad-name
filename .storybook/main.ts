import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  // `.mdx` first so hand-written pages sort ahead of the generated ones.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@chromatic-com/storybook', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The theme paints its own surface and the Theme toolbar already switches
  // light and dark, so the backgrounds addon would only offer a third, wrong
  // answer. Turned off here rather than through `parameters.backgrounds`:
  // that parameter is the deprecated config API the CLI warns about, and the
  // automigration's own fix renames `disable` to `disabled` — a key the 10.5
  // runtime never reads, so it silences the warning and re-enables the addon.
  features: { backgrounds: false },
  viteFinal: (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      // `fake-indexeddb` is the UNIT project's shim — the browser has a real
      // IndexedDB and never needs it. But Vite's dependency scanner crawls all
      // of `src`, finds the import in `src/test-setup.ts`, and pre-bundles it
      // MID-RUN. That prints "optimized dependencies changed. reloading" and
      // reloads the page, which drops the websocket and surfaces in the Testing
      // panel as "Connection lost" — reliably around test 56 of 252.
      exclude: [...(config.optimizeDeps?.exclude ?? []), 'fake-indexeddb', 'fake-indexeddb/auto'],
      // Scanning entries are the stories, not every file under `src`. No `../`
      // here even though `stories` above needs it: that field is resolved
      // against this directory, while Vite globs `optimizeDeps.entries` against
      // its own root, which builder-vite sets to the repo root. With the `../`
      // these patterns pointed one level ABOVE the repo and matched nothing, so
      // the narrowing was really a silent opt-out of scanning altogether.
      entries: ['src/**/*.stories.@(ts|tsx)', 'src/**/*.mdx'],
    },
  }),
}

export default config
