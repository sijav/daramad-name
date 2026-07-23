import { msg } from '@lingui/core/macro'
import bidiFactory from 'bidi-js'
import * as fontkit from 'fontkit'
import { i18n } from 'src/core/i18n'

// Bidi reordering for the PDF text stack.
//
// fontkit's `layout` reverses an entire RTL string as one blob. Persian digits
// (U+06F0 to U+06F9) are Unicode bidi class EN, a left-to-right number run
// inside right-to-left text, so a blind reverse prints «۱۴۰۵» as «۵۰۴۱». The fix
// is to run UAX#9 (bidi-js) first, split the string into maximal same-level
// runs, and shape each run alone, where fontkit's own reversal is then correct.
// Runs are shaped in LOGICAL order, because Arabic joining needs logical
// adjacency, and the shaped glyphs are concatenated in visual run order.
//
// `layout` is the choke point every pdfkit text call flows through, so that is
// what `installBidiLayout` patches. There can be more than one fontkit copy at
// runtime, this file imports the ESM build while pdfkit `require`s the CommonJS
// one and Node does not dedupe them, so the patch goes on the prototype of
// whatever font it is handed and each call site patches its own. See the note
// in `renderCertificatePdf.ts`.

const bidi = bidiFactory()

// Right-to-left scripts by code point, in order: Hebrew, Arabic, Syriac, Arabic
// Supplement, Thaana, NKo, Arabic Extended-A, then the Hebrew and Arabic
// presentation-forms blocks.
const RTL_RANGES = [
  [0x0590, 0x05ff],
  [0x0600, 0x06ff],
  [0x0700, 0x074f],
  [0x0750, 0x077f],
  [0x0780, 0x07bf],
  [0x07c0, 0x07ff],
  [0x08a0, 0x08ff],
  [0xfb1d, 0xfb4f],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfefc],
]

const hasRtl = (text: string): boolean => {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (RTL_RANGES.some(([lo, hi]) => code >= lo && code <= hi)) return true
  }
  return false
}

interface GlyphRunLike {
  glyphs: unknown[]
  positions: unknown[]
}

type LayoutFn = (
  this: unknown,
  string: string,
  features?: unknown,
  script?: unknown,
  language?: unknown,
  direction?: 'ltr' | 'rtl',
) => GlyphRunLike

/** A stretch of text carrying one embedding level. */
interface Span {
  text: string
  level: number
}

/** Maximal spans of equal embedding level, in logical order. */
const splitRuns = (text: string, levels: Uint8Array): Span[] => {
  const runs: Span[] = []
  let start = 0
  for (let i = 1; i <= text.length; i += 1) {
    if (i === text.length || levels[i] !== levels[start]) {
      runs.push({ text: text.slice(start, i), level: levels[start] })
      start = i
    }
  }
  return runs
}

/**
 * UAX#9 rule L2 at run granularity: from the highest level down to 1, reverse
 * every contiguous stretch of runs at or above that level. Runs are maximal
 * single-level spans, so this is equivalent to the per-character rule. Returns
 * the run indices in visual (left-to-right) order.
 *
 * bidi-js `getReorderSegments` cannot stand in for this. It reverses character
 * ranges, and what is needed here is the order of runs shaped separately.
 */
const visualRunOrder = (runs: { level: number }[]): number[] => {
  const order = runs.map((_, index) => index)
  const maxLevel = runs.reduce((max, run) => Math.max(max, run.level), 0)
  for (let level = maxLevel; level >= 1; level -= 1) {
    let i = 0
    while (i < order.length) {
      if (runs[order[i]].level >= level) {
        let j = i
        while (j < order.length && runs[order[j]].level >= level) j += 1
        for (let a = i, b = j - 1; a < b; a += 1, b -= 1) {
          ;[order[a], order[b]] = [order[b], order[a]]
        }
        i = j
      } else {
        i += 1
      }
    }
  }
  return order
}

/**
 * Reorders ONE line into visual order at word granularity.
 *
 * pdfkit measures and draws one WORD at a time and places them left to right in
 * the order received, so a right-to-left sentence arrives with every word
 * correctly shaped and the words themselves backwards. Each word's characters
 * stay in LOGICAL order, which is what the shaper needs to form the cursive
 * joins and what lets the patched `layout` still order a mixed word such as a
 * `DN-۱۴۰۵-QQPE0T` serial.
 *
 * Bidi order is defined per visual line, so callers wrap into lines first and
 * reorder each line after, never the reverse.
 */
export const toVisualLine = (text: string): string => {
  if (!hasRtl(text)) return text
  const { levels } = bidi.getEmbeddingLevels(text, 'auto')

  // Words are reordered and rejoined with single spaces. Reordering whole runs
  // instead carried the space at a run's edge to its other end, gluing one pair
  // of words («تاریخصدور») and doubling the gap at the next: the separators have
  // to be regenerated, not moved. A word's level is its first character's.
  const words: Span[] = [...text.matchAll(/\S+/g)].map((match) => ({ text: match[0], level: levels[match.index] }))

  return visualRunOrder(words)
    .map((index) => words[index].text)
    .join(' ')
}

// Registered globally so two copies of this module agree on the flag and cannot
// double-wrap a prototype one of them already patched.
const PATCHED = Symbol.for('daramadname.bidi-layout')

/**
 * Patches the bidi-aware `layout` onto the prototype of the font it is handed.
 * Idempotent per prototype, so every call site can safely patch its own fontkit
 * copy. It takes a font instance because fontkit exports no Font class to reach
 * the prototype directly.
 *
 * Throws when the probe has no `layout` anywhere on its prototype chain, which
 * only happens if fontkit changes shape. Returning quietly would print «۱۴۰۵» as
 * «۵۰۴۱» on a page that otherwise looks like a correct certificate.
 */
export const installBidiLayout = (probe: unknown): void => {
  let proto = Object.getPrototypeOf(probe as object)
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'layout')) {
    proto = Object.getPrototypeOf(proto)
  }
  if (!proto) {
    throw new Error(i18n._(msg`The report could not be prepared for Persian text. Reload the page and try again.`))
  }
  if ((proto as Record<symbol, unknown>)[PATCHED]) return

  const original = (proto as { layout: LayoutFn }).layout
  ;(proto as { layout: LayoutFn }).layout = function patchedLayout(string, features, script, language, direction) {
    // An explicit direction, a non-string, or text with no RTL character all
    // want the stock behaviour.
    if (direction || typeof string !== 'string' || !hasRtl(string)) {
      return original.call(this, string, features, script, language, direction)
    }

    // Surrounding spaces are shaped separately and pinned back where they were.
    // pdfkit hands over one word AT A TIME with its trailing space attached and
    // then places the next word after it, so a space carried to the other side
    // opens the gap on the wrong side: «۱فروردین» glued, «فروردین  ۱۴۰۵» doubled.
    const leading = /^\s+/.exec(string)?.[0] ?? ''
    const trailing = /\s+$/.exec(string)?.[0] ?? ''
    // Never empty: `hasRtl` held above and no RTL code point is whitespace.
    const core = string.slice(leading.length, string.length - trailing.length)

    // 'auto' resolves the base direction from the first strong character, which
    // is what a bare paragraph should do: a Persian sentence reads RTL, a line
    // that opens with a Latin serial reads LTR, digits alone stay LTR.
    const { levels } = bidi.getEmbeddingLevels(core, 'auto')
    const runs = splitRuns(core, levels)
    const order = visualRunOrder(runs)
    const shaped = runs.map((run) => original.call(this, run.text, features, script, language, run.level & 1 ? 'rtl' : 'ltr'))

    // Concatenate the shaped glyphs in visual order into one of the real
    // GlyphRun objects (its `advanceWidth`/`bbox` getters recompute from the
    // arrays we swap in), so pdfkit sees an ordinary fontkit run.
    const glyphs: unknown[] = []
    const positions: unknown[] = []
    const append = (piece: GlyphRunLike) => {
      glyphs.push(...piece.glyphs)
      positions.push(...piece.positions)
    }
    if (leading) append(original.call(this, leading, features, script, language, 'ltr'))
    for (const index of order) append(shaped[index])
    if (trailing) append(original.call(this, trailing, features, script, language, 'ltr'))

    const run = shaped[order[0]]
    run.glyphs = glyphs
    run.positions = positions
    return run
  }
  ;(proto as Record<symbol, unknown>)[PATCHED] = true
}

/** Re-exported so a caller can make a probe without a second fontkit import. This is the ESM copy, which need not be pdfkit's. */
export { fontkit }
