/// <reference types="vite/client" />

// `noUncheckedSideEffectImports` requires every side-effect import to resolve to
// a module with declarations. Fontsource packages ship CSS only, with no types,
// so they are declared here.
declare module '@fontsource-variable/vazirmatn'

// Vite's `?url` suffix returns the emitted asset path as a string. The font
// files are loaded this way so pdfmake and @font-face get a real URL rather
// than an inlined blob.
declare module '*.ttf?url' {
  const src: string
  export default src
}

declare module '*.woff2?url' {
  const src: string
  export default src
}
