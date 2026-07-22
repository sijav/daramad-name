import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
            // so it inherits `base` — which is what keeps `start_url` and
            // `scope` correct on GitHub Pages' `/daramad-name/` subpath.
            manifest: {
              // Explicit so the identity survives a change of `start_url`;
              // without it the browser derives the id FROM `start_url` and a
              // reinstall would look like a different app.
              id: base,
              // These are data, not interface copy: a manifest is read by the
              // operating system before any locale is chosen, and the app is
              // Persian by default. They are not lingui messages.
              name: 'درآمدنامه — دفتر دریافتی‌ها و گزارش درآمد',
              short_name: 'درآمدنامه',
              description: 'دفتر دریافتی‌ها و گزارش درآمد قابل ارائه برای فریلنسر ایرانی. همه‌ی داده‌ها فقط روی مرورگر خودت می‌مونه.',
              lang: 'fa-IR',
              dir: 'rtl',
              start_url: base,
              scope: base,
              display: 'standalone',
              // Matches `<meta name="theme-color">` in index.html; a mismatch is
              // the most common reason an installed window paints the wrong bar.
              theme_color: '#3b6ef5',
              background_color: '#f8f9fb',
              categories: ['finance', 'business', 'productivity'],
              icons: [
                { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                // A launcher clips a maskable icon to its own shape, so these
                // are separate files with the glyph inside the safe zone rather
                // than `purpose: 'any maskable'` on the ones above. Chrome
                // counts only `any` icons towards the 192/512 install
                // requirement, which is why both sets exist.
                { src: 'pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              // Everything the app can ever need, because there is no backend:
              // once the shell and the fonts are cached the whole product works
              // with the network off, which is its honest default rather than a
              // bonus. `ttf` is not in workbox's default list and matters most —
              // those two files are the Vazirmatn cuts pdfmake embeds, and
              // without them the PDF certificate renders Persian as empty boxes.
              globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,ttf}'],
              // The pdfmake chunk is ~950KB on its own; the default 2MiB ceiling
              // clears it today, but a bump would silently drop the report from
              // the precache instead of failing the build.
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              // A stale precache from a previous deploy is worse than no cache:
              // it can pair an old chunk with a new entry point.
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              // Deep links (`/ledger`, `/report`) have no file behind them, so
              // navigations resolve to the SPA shell — the service-worker
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
    // pdfmake carries embedded font tables and is by far the largest dependency.
    // It is loaded with a dynamic `import()` at the point of use rather than
    // being split by name here, which keeps it off the initial page load
    // without depending on the bundler's chunking API.
    chunkSizeWarningLimit: 900,
  },
})
