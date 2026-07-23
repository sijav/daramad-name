import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { type ManifestOptions, VitePWA } from 'vite-plugin-pwa'
import manifestJson from './pwa-manifest.json' with { type: 'json' }

// A JSON import widens every string to `string`, so `display: 'standalone'` no
// longer satisfies the plugin's `Display` union. The assertion re-narrows it;
// the file is validated by the build, which rejects an unknown display mode.
const manifest = manifestJson as Partial<ManifestOptions>

// `base` is read from an env var so the same build works on both deploy targets:
// GitHub Pages serves from a repo subpath, Liara serves from the domain root.
const base = process.env.VITE_BASE_PATH ?? '/'

// Storybook's Vite builder merges THIS file into its own config, so the PWA
// plugin would otherwise emit a second service worker into `storybook-static`
// and precache the whole component library. `storybook`'s CLI sets this before
// it loads any config, for both `dev` and `build`.
const isStorybook = process.env.STORYBOOK === 'true'

export default defineConfig({
  base,
  plugins: [
    react({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
    // The report certificate is drawn with pdfkit, which is a Node library:
    // it reaches for `Buffer`, `stream`, `zlib` and `fs`. In the browser those
    // do not exist, so this shims them. It is deliberately NOT gated behind
    // `isStorybook`, the browser test project renders the report story too and
    // needs the same shims. The Node unit project uses its own `vitest.config`
    // and never loads this file, so its tests keep the real Node modules.
    // Only the four subsystems pdfkit touches are polyfilled, and the report
    // chunk is dynamically imported, so this stays out of the initial bundle.
    // See TECH-DEBT.md, pdfkit in the browser.
    nodePolyfills({
      include: ['buffer', 'stream', 'zlib', 'util', 'events', 'string_decoder', 'fs'],
      // `process` is needed too: pdfkit's stream shim (readable-stream) calls
      // `process.nextTick`. `Buffer` and `global` are the other two globals its
      // Node code assumes exist.
      globals: { Buffer: true, global: true, process: true },
    }),
    ...(isStorybook
      ? []
      : [
          VitePWA({
            // The app is local-first: there is no server to coordinate with, so
            // a new build should simply take over. `autoUpdate` installs the new
            // worker and reloads once it controls the page, rather than asking
            // the user to approve an update they have no way to reason about.
            registerType: 'autoUpdate',
            // Registration is written by hand in `src/pwa/registerServiceWorker`
            // and called from `main.tsx`. Injecting a script tag into
            // `index.html` instead would also inject it into every other HTML
            // entry Vite processes, and it puts the registration outside the
            // module graph where nothing can see or test it.
            injectRegister: null,
            // The manifest is emitted next to `index.html` and linked from it,
            // so it inherits `base`, which is what keeps `start_url` and
            // `scope` correct on GitHub Pages' `/daramad-name/` subpath.
            // The static half lives in `pwa-manifest.json`, which is the only
            // Persian the build owns: a manifest is read by the operating
            // system before any locale is chosen, so its description cannot be
            // a lingui message, but it is still copy, and copy does not belong
            // in a config file. The NAME there is deliberately Latin: it is
            // what the OS prints under the installed icon, in the launcher and
            // in the app switcher, none of which are guaranteed to shape
            // Persian correctly, and a product needs one spelling people can
            // type and search for. The interface itself stays Persian.
            //
            // The three URL fields are derived rather than written down, so
            // they follow `base` onto GitHub Pages' `/daramad-name/` subpath.
            // `id` is explicit so the identity survives a change of `start_url`
            //, without it the browser derives the id FROM `start_url`, and a
            // reinstall would look like a different app.
            manifest: { ...manifest, id: base, start_url: base, scope: base },
            workbox: {
              // Everything the app can ever need, because there is no backend:
              // once the shell and the fonts are cached the whole product works
              // with the network off, which is its honest default rather than a
              // bonus. `ttf` is not in workbox's default list and matters most
              // those two files are the Vazirmatn cuts pdfkit embeds, and
              // without them the PDF certificate renders Persian as empty boxes.
              globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,ttf}'],
              // The pdfkit and fontkit chunks are ~700KB combined; the default
              // 2MiB ceiling clears them today, but a bump would silently drop
              // the report from the precache instead of failing the build.
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              // A stale precache from a previous deploy is worse than no cache:
              // it can pair an old chunk with a new entry point.
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              // Deep links (`/ledger`, `/report`) have no file behind them, so
              // navigations resolve to the SPA shell, the service-worker
              // equivalent of the `404.html` copy the Pages deploy makes.
              navigateFallback: `${base}index.html`,
              navigateFallbackDenylist: [
                // Storybook is deployed INSIDE the app's scope at
                // `<base>storybook/`, so the worker controls it. Without this it
                // would answer every Storybook navigation with the app shell.
                /\/storybook\//,
              ],
            },
            // The dev server does not need a worker, and a stale one there is a
            // long, confusing debugging session. `npm run preview` serves the
            // real build, which is where installability is verified.
            devOptions: { enabled: false },
          }),
        ]),
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // pdfkit and fontkit carry embedded font machinery and are the largest
    // dependencies. They are loaded with a dynamic `import()` at the point of
    // use rather than being split by name here, which keeps them off the initial
    // page load without depending on the bundler's chunking API.
    chunkSizeWarningLimit: 900,
  },
})
