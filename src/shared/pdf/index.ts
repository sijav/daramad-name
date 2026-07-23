// `loadPdf` is the whole public surface: it owns the font, the bidi shim and
// the renderer, so nothing outside needs the document builder or its types.
export { loadPdf } from './loadPdf'
