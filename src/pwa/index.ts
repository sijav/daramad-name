// `registerServiceWorker` is deliberately absent from this barrel: it imports
// the plugin's `virtual:pwa-register` module, which only exists in the app
// build. Anything Storybook or the test runner renders must be reachable
// without it, so `main.tsx` imports that module by path instead.
export { InstallAppSection } from 'src/pwa/InstallAppSection'
export { useInstallPrompt, type InstallPromptState } from 'src/pwa/useInstallPrompt'
