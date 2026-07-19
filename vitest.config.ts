import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The lingui macros (`t`, `msg`, `Trans`) are compile-time transforms. Without
  // this plugin any module importing them throws at runtime — even a test that
  // only touches pure helpers, because the constants module sits in its import
  // graph.
  plugins: [react({ plugins: [['@lingui/swc-plugin', {}]] })],
  resolve: {
    alias: { src: fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
