import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { type ManifestOptions, VitePWA } from 'vite-plugin-pwa'
import manifestJson from './pwa-manifest.json' with { type: 'json' }

// A JSON import widens every string, so `display` and `dir` stop satisfying the
// plugin's unions. This assertion re-narrows them and, being an assertion,
// checks nothing: a typo in either field reaches the browser.
const manifest = manifestJson as Partial<ManifestOptions>

// GitHub Pages serves from a repo subpath, Liara from the domain root. Set per
// target in `.github/workflows/deploy.yml`.
const base = process.env.VITE_BASE_PATH ?? '/'

// Storybook's Vite builder merges THIS file into its own config, so without the
// gate the PWA plugin emits a second service worker into `storybook-static` and
// precaches the component library. Storybook's CLI sets the var before loading
// any config, for both `dev` and `build`.
const isStorybook = process.env.STORYBOOK === 'true'

export default defineConfig({
  base,
  plugins: [
    react({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
    // The certificate is drawn with pdfkit, a Node library. Deliberately NOT
    // gated behind `isStorybook`: the browser test project renders the report
    // story and needs the same shims. The Node unit project uses its own
    // `vitest.config.ts` and keeps the real modules. See TECH-DEBT.md 7a.
    nodePolyfills({
      include: ['buffer', 'stream', 'zlib', 'util', 'events', 'string_decoder', 'fs'],
      // readable-stream, pdfkit's stream shim, calls `process.nextTick`.
      // `Buffer` and `global` are the other two globals its Node code assumes.
      globals: { Buffer: true, global: true, process: true },
    }),
    ...(isStorybook
      ? []
      : [
          VitePWA({
            // No server to coordinate with, so a new build takes over rather
            // than asking the user to approve an update they cannot reason about.
            registerType: 'autoUpdate',
            // Registration is written by hand in `src/pwa/registerServiceWorker`
            // and called from `main.tsx`. Injecting a script tag would inject it
            // into every HTML entry Vite processes, and would put the call
            // outside the module graph.
            injectRegister: null,
            // Emitted next to `index.html` and linked from it, so it inherits
            // `base`. The three URL fields are derived for the same reason.
            // `id` is explicit because the browser otherwise derives it FROM
            // `start_url`, and changing `start_url` would then read as a
            // different app on reinstall.
            manifest: { ...manifest, id: base, start_url: base, scope: base },
            workbox: {
              // There is no backend, so precaching the shell and the fonts makes
              // the whole app work offline. `ttf` is not in workbox's default
              // list, and the two Vazirmatn cuts pdfkit embeds are `.ttf`;
              // without them the PDF renders Persian as empty boxes.
              globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,ttf}'],
              // Per file. The largest asset today is ~380 KB, well inside
              // workbox's 2 MiB default; this is headroom, because an asset over
              // the ceiling is dropped from the precache with no build error and
              // the report then fails offline.
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              // A precache left over from a previous deploy can pair an old
              // chunk with a new entry point.
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              // Deep links (`/ledger`, `/report`) have no file behind them, so
              // navigations resolve to the SPA shell. Same job as the `404.html`
              // copy the Pages deploy makes.
              navigateFallback: `${base}index.html`,
              navigateFallbackDenylist: [
                // Storybook is deployed INSIDE the app's scope at
                // `<base>storybook/`, so the worker controls it and would
                // otherwise answer its navigations with the app shell.
                /\/storybook\//,
              ],
            },
            // A stale worker on the dev server caches the files being edited.
            // `npm run preview` serves the real build, where installability is
            // verified.
            devOptions: { enabled: false },
          }),
        ]),
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
