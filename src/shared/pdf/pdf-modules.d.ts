// Ambient types for the two PDF dependencies that ship no declarations.
// Only the surface this codebase actually uses is described.

declare module 'bidi-js' {
  interface EmbeddingLevels {
    levels: Uint8Array
    paragraphs: { start: number; end: number; level: number }[]
  }
  interface Bidi {
    /** UAX#9 resolved embedding levels; base 'auto' derives from the first strong char. */
    getEmbeddingLevels(text: string, baseDirection?: 'ltr' | 'rtl' | 'auto'): EmbeddingLevels
    getReorderSegments(text: string, embeddingLevels: EmbeddingLevels): [number, number][]
  }
  export default function bidiFactory(): Bidi
}

declare module 'fontkit' {
  export interface Glyph {
    id: number
    codePoints: number[]
    advanceWidth: number
  }
  export interface GlyphRun {
    glyphs: Glyph[]
    positions: { xAdvance: number }[]
    advanceWidth: number
  }
  export interface Font {
    layout(text: string, features?: unknown, script?: string, language?: string, direction?: 'ltr' | 'rtl'): GlyphRun
  }
  export function create(buffer: Uint8Array): Font
  export function openSync(path: string): Font
}
