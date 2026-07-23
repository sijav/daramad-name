import { msg } from '@lingui/core/macro'
import bidiFactory from 'bidi-js'
import * as fontkit from 'fontkit'
import { i18n } from 'src/core/i18n'

// The bidi layer the PDF stack was missing.
//
// pdfkit hands a whole line of text to fontkit's `layout`, and fontkit, when
// it sees an RTL script, reverses the ENTIRE run as one blob. That is fine for
// a line that is purely Persian letters, but a certificate line is never that:
// «۱ فروردین ۱۴۰۵» mixes an RTL word with Persian DIGITS, and reversing the whole
// thing turns ۱۴۰۵ into ۵۰۴۱. Persian digits (U+06F0, 06F9) are Unicode bidi class
// EN, a number run that must stay left-to-right INSIDE right-to-left text. A
// blind reverse is not the bidi algorithm; it is the bug we shipped.
//
// The fix is to run real UAX#9 bidi (bidi-js) FIRST, which splits the line into
// maximal same-direction runs and tells us their visual order. Each run is then
// pure-direction, so fontkit's own reversal is exactly right for it, an RTL run
// reverses, a digit run does not. We shape each run in LOGICAL order (Arabic
// joining needs logical adjacency; pre-reversing the characters breaks the
// cursive forms) and concatenate the shaped glyphs in visual run order.
//
// This is installed by monkey-patching fontkit's `layout`, because that is the
// single choke point every pdfkit text call flows through. pdfkit and this file
// import the SAME fontkit module (the bundler dedupes it), so the patch reaches
// pdfkit's fonts without pdfkit knowing anything changed.

const bidi = bidiFactory()

// Code-point ranges whose scripts are written right-to-left: Hebrew, Arabic,
// Syriac, Thaana, NKo, Arabic Supplement/Extended-A, and the Hebrew/Arabic
// presentation-forms blocks. Expressed as numbers rather than a literal-glyph
// character class, so the source carries no RTL bytes of its own.
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

// A line with no RTL character never needed reordering, so it skips straight to
// the original fast path.
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

/** Maximal spans of equal embedding level, in logical order. */
const splitRuns = (text: string, levels: Uint8Array): { text: string; level: number }[] => {
  const runs: { text: string; level: number }[] = []
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
 * every contiguous stretch of runs whose level is at least that high. Runs are
 * maximal single-level spans, so reversing whole runs is equivalent to the
 * per-character rule. Returns the run indices in visual (left-to-right) order.
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
 * `installBidiLayout` fixes the characters inside whatever string the shaper is
 * given, but pdfkit never gives it a whole line. It measures and draws one WORD
 * at a time and lays those words out left to right in the order received, so a
 * right-to-left sentence arrives with every word correctly shaped and the words
 * themselves backwards: «گزارش درآمد فریلنسری» came out reading
 * «فریلنسری درآمد گزارش», and «۴۵۸٬۳۹۰٬۰۰۰ تومان» put the unit on the wrong side.
 *
 * So the words are put where they belong BEFORE pdfkit sees them. Each word's
 * characters stay in LOGICAL order, which is what the shaper needs to form the
 * cursive joins, and what lets `installBidiLayout` still fix a mixed run inside
 * a single word, such as a `DN-۱۴۰۵-QQPE0T` serial.
 *
 * Bidi ordering is defined per VISUAL line, so callers must wrap text into lines
 * first and reorder each line, never reorder and then wrap.
 */
export const toVisualLine = (text: string): string => {
  if (!hasRtl(text)) return text
  const { levels } = bidi.getEmbeddingLevels(text, 'auto')

  // Reorder at WORD granularity, then rejoin with single spaces. Reordering
  // whole runs instead moves the space that sat at a run's edge to its other
  // end, which glues one pair of words together («تاریخصدور») and doubles the
  // gap at the next, the separators must be regenerated, not carried along.
  // A word's level is its first character's; a word with mixed content, like a
  // `DN-۱۴۰۵-QQPE0T` serial, is placed as a unit and put in order internally by
  // `installBidiLayout`.
  const words: { text: string; level: number }[] = []
  const pattern = /\S+/g
  let match = pattern.exec(text)
  while (match) {
    words.push({ text: match[0], level: levels[match.index] })
    match = pattern.exec(text)
  }

  return visualRunOrder(words)
    .map((index) => words[index].text)
    .join(' ')
}

const PATCHED = Symbol.for('daramadname.bidi-layout')

/**
 * Installs the bidi-aware `layout` on fontkit's font prototype. Idempotent and
 * cheap to call repeatedly, it patches the shared prototype the first time and
 * no-ops after. Pass any opened font (fontkit exposes no class to reach the
 * prototype otherwise); the loader hands it the Vazirmatn probe it already has.
 *
 * Throws when the probe has no `layout` anywhere on its prototype chain. That
 * only happens if fontkit changes shape, and returning quietly instead would
 * ship a certificate with every year reversed, the one failure mode that looks
 * completely normal to whoever generates the document.
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
    // An explicit direction, a non-string, or a line with no RTL character all
    // want the stock behaviour, the reversal problem cannot arise there.
    if (direction || typeof string !== 'string' || !hasRtl(string)) {
      return original.call(this, string, features, script, language, direction)
    }

    // Surrounding spaces stay put. pdfkit hands over one word AT A TIME with its
    // trailing space attached and then places the next word after it, so if the
    // reversal carries that space to the other side the gap opens on the wrong
    // side of the word, «۱فروردین» glued, «فروردین  ۱۴۰۵» doubled. Only the
    // core is reordered; the spaces are shaped separately and pinned back.
    const leading = /^\s+/.exec(string)?.[0] ?? ''
    const trailing = /\s+$/.exec(string)?.[0] ?? ''
    const core = string.slice(leading.length, string.length - trailing.length)
    if (!core) {
      return original.call(this, string, features, script, language, 'ltr')
    }

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

/** Re-exported so callers do not need a second fontkit import to make a probe. */
export { fontkit }
