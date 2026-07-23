// `/vanillajs` rather than `/client`: the latter also pulls in the Vue, React,
// Svelte, Solid and Preact virtual-module declarations, which is a bigger
// surface than a plain `registerSW` call needs.
/// <reference types="vite-plugin-pwa/vanillajs" />
import { registerSW } from 'virtual:pwa-register'

/**
 * Registers the generated service worker.
 *
 * Called from `main.tsx` rather than injected into `index.html`, so the call
 * lives in the module graph where it can be read and reasoned about. It is
 * deliberately NOT exported from `src/pwa/index.ts`: the barrel is imported by
 * components that Storybook and the test runner render, and neither of those
 * builds loads the PWA plugin, so `virtual:pwa-register` would not resolve.
 *
 * In `npm run dev` the plugin resolves this import to a no-op, because
 * `devOptions` is off, a service worker on the dev server caches the very
 * files you are editing.
 */
export const registerServiceWorker = () => {
  registerSW({
    // Register straight away instead of waiting for `window.load`. The app
    // already blocks first paint on the locale catalog, so there is no load
    // event worth deferring to, and an earlier registration means Chrome can
    // evaluate installability sooner.
    immediate: true,
    onRegisterError: (error: unknown) => {
      // Nothing to recover: without a worker the app still works, it just is
      // not installable or offline-capable. Surfacing it in the console is the
      // honest amount of noise.
      console.error('Service worker registration failed', error)
    },
  })
}
