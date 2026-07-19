import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// `base` is read from an env var so the same build works on both deploy targets:
// GitHub Pages serves from a repo subpath, Liara serves from the domain root.
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
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
