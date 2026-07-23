import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fontkit, installBidiLayout, toVisualLine } from './bidiText'

// The bug this whole path exists to kill: «۱ فروردین ۱۴۰۵» printed as
// «۱ فروردین ۵۰۴۱» because the shaper reversed the digit run along with the RTL
// letters. These assertions read the glyphs the font would DRAW, left to right,
// and check the digits survive in order. They run in Node against the real
// Vazirmatn file — the same font the browser embeds.

const fontPath = fileURLToPath(new URL('../../../node_modules/vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf', import.meta.url))
const font = fontkit.create(readFileSync(fontPath)) as { layout: (text: string) => { glyphs: { codePoints: number[] }[] } }
installBidiLayout(font)

/** The base characters of each glyph, in the order the font lays them out. */
const drawn = (text: string) =>
  font
    .layout(text)
    .glyphs.map((glyph) => String.fromCodePoint(...glyph.codePoints))
    .join('')

describe('installBidiLayout', () => {
  it('keeps a Persian year left-to-right instead of reversing it', () => {
    const out = drawn('۱ فروردین ۱۴۰۵')

    expect(out).toContain('۱۴۰۵')
    expect(out).not.toContain('۵۰۴۱')
  })

  it('does not reverse grouped Persian digits in an amount', () => {
    const out = drawn('۵۹۲٬۵۹۲٬۵۹۲ تومان')

    expect(out).toContain('۵۹۲٬۵۹۲٬۵۹۲')
  })

  it('leaves a Latin-and-digit island intact inside RTL text', () => {
    const out = drawn('شناسه سند: DN-۱۴۰۵-QQPE0T')

    // The serial must read the same on the page as it does in the data.
    expect(out).toContain('DN-۱۴۰۵-QQPE0T')
  })

  it('reorders a full mixed line into the correct visual sequence', () => {
    // Read right-to-left, the drawn string is «۱ فروردین ۱۴۰۵ تا ۳۱ شهریور ۱۴۰۵».
    const out = drawn('۱ فروردین ۱۴۰۵ تا ۳۱ شهریور ۱۴۰۵')

    expect(out).toContain('۱۴۰۵')
    expect(out).toContain('۳۱')
    expect(out).not.toContain('۵۰۴۱')
    expect(out).not.toContain('۱۳ ')
  })

  it('leaves a purely Latin string untouched (fast path)', () => {
    expect(drawn('DN-2026')).toBe('DN-2026')
  })

  // pdfkit hands over one word WITH its trailing space and places the next word
  // straight after it. If the reversal carries that space to the front, the gap
  // lands on the wrong side of the word — «۱فروردین» glued, «فروردین  ۱۴۰۵»
  // doubled — which is exactly what the printed certificate showed.
  it('keeps a trailing space at the end of the glyph run, not the start', () => {
    const out = drawn('فروردین ')

    expect(out.endsWith(' ')).toBe(true)
    expect(out.startsWith(' ')).toBe(false)
  })

  it('keeps a leading space at the start of the glyph run', () => {
    const out = drawn(' فروردین')

    expect(out.startsWith(' ')).toBe(true)
    expect(out.endsWith(' ')).toBe(false)
  })
})

// pdfkit draws one WORD at a time, left to right, in the order it is given — so
// a right-to-left sentence printed as-is comes out with every word shaped
// correctly and the words themselves backwards. `toVisualLine` puts them where
// they belong first. These are the exact lines that were reported wrong.
describe('toVisualLine', () => {
  it('puts the words of a Persian sentence in visual order', () => {
    // Read right-to-left, this is «گزارش درآمد فریلنسری».
    expect(toVisualLine('گزارش درآمد فریلنسری')).toBe('فریلنسری درآمد گزارش')
  })

  it('keeps the unit on the correct side of an amount', () => {
    // «۴۵۸٬۳۹۰٬۰۰۰ تومان» must not print as «تومان ۴۵۸٬۳۹۰٬۰۰۰» when read.
    expect(toVisualLine('۴۵۸٬۳۹۰٬۰۰۰ تومان')).toBe('تومان ۴۵۸٬۳۹۰٬۰۰۰')
  })

  it('puts the year to the left of its month name', () => {
    expect(toVisualLine('فروردین ۱۴۰۵')).toBe('۱۴۰۵ فروردین')
  })

  it('never reverses the digits themselves while reordering words', () => {
    const out = toVisualLine('۱ فروردین ۱۴۰۵')

    expect(out).toContain('۱۴۰۵')
    expect(out).not.toContain('۵۰۴۱')
  })

  it('leaves a Latin sentence alone', () => {
    expect(toVisualLine('Statement of Income')).toBe('Statement of Income')
  })

  // Reordering whole runs used to carry a run's edge space to its other end,
  // which glued one pair of words and doubled the gap at the next. Every one of
  // these was reported off the printed certificate.
  it.each([
    'میانگین درآمد ماهانه',
    'تاریخ صدور',
    'بازه‌ی گزارش',
    '۶۵٬۴۸۴٬۲۸۶ تومان',
    'تهران، خیابان کریم‌خان',
    '۱ فروردین ۱۴۰۵ — ۲۹ اسفند ۱۴۰۵',
  ])('separates every word of %s with exactly one space', (line) => {
    const out = toVisualLine(line)

    expect(out).not.toMatch(/\s{2,}/)
    expect(out.startsWith(' ')).toBe(false)
    expect(out.endsWith(' ')).toBe(false)
    // Nothing may be lost or fused: the same words, just reordered.
    expect(out.split(' ').sort()).toEqual(line.split(/\s+/).sort())
  })
})
