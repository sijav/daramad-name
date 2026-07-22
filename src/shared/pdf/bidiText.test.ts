import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fontkit, installBidiLayout } from './bidiText'

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
})
