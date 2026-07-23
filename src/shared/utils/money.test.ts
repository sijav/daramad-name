import { describe, expect, it } from 'vitest'
import { parseUserNumber, toEnglishDigits, toPersianDigits } from './digits'
import { computeToman, formatNumber } from './money'

// These cover the rules that would be silently, permanently wrong if broken
// a wrong total in a financial tool is worse than a crash, because nobody notices.

describe('computeToman: the freeze rule', () => {
  it('multiplies by the rate captured at record time', () => {
    // Scenario 1: 500 USDT at 98,500 toman.
    expect(computeToman(500, 'USDT', 98500)).toBe(49_250_000)
  })

  it('ignores any rate for toman receipts', () => {
    expect(computeToman(2_500_000, 'TOMAN', 99999)).toBe(2_500_000)
  })

  it('rounds to whole toman, which has no sub-unit', () => {
    expect(computeToman(10.5, 'USD', 96201)).toBe(1_010_111)
  })

  it('yields zero rather than NaN when a non-toman receipt has no rate', () => {
    // A NaN here would poison every downstream sum silently.
    expect(computeToman(500, 'USDT', null)).toBe(0)
  })

  it('is a pure function of its arguments, so stored values never drift', () => {
    const first = computeToman(750, 'USDT', 94800)
    const second = computeToman(750, 'USDT', 94800)
    expect(first).toBe(second)
    expect(first).toBe(71_100_000)
  })
})

describe('formatNumber: locale-driven numbering', () => {
  it('uses Persian digits and the Arabic thousands separator for fa-IR', () => {
    // U+066C, not a Latin comma: «۱۲٬۵۰۰٬۰۰۰» is what a Persian reader writes.
    expect(formatNumber(12_500_000, 'fa-IR')).toBe('۱۲٬۵۰۰٬۰۰۰')
  })

  it('uses Latin digits and commas for en-US', () => {
    expect(formatNumber(12_500_000, 'en-US')).toBe('12,500,000')
  })

  it('renders an empty month as a zero rather than blank', () => {
    expect(formatNumber(0, 'fa-IR')).toBe('۰')
    expect(formatNumber(0, 'en-US')).toBe('0')
  })

  it('keeps two decimals for foreign currency amounts', () => {
    expect(formatNumber(1500.5, 'en-US', 2)).toBe('1,500.50')
  })
})

describe('digit normalisation', () => {
  it('accepts Persian digits from a Persian keyboard', () => {
    expect(parseUserNumber('۲۵۰۰')).toBe(2500)
  })

  it('accepts English digits from a Latin keyboard', () => {
    expect(parseUserNumber('2500')).toBe(2500)
  })

  it('tolerates thousands separators the user typed or pasted', () => {
    expect(parseUserNumber('۱۲,۵۰۰,۰۰۰')).toBe(12_500_000)
    expect(parseUserNumber('12٬500٬000')).toBe(12_500_000)
  })

  it('keeps decimals for currencies that have them', () => {
    expect(parseUserNumber('۱۲۰۰٫۵۰')).toBe(1200.5)
  })

  it('returns null for junk instead of NaN', () => {
    expect(parseUserNumber('abc')).toBeNull()
    expect(parseUserNumber('')).toBeNull()
  })

  it('round-trips Persian and English digits', () => {
    expect(toEnglishDigits(toPersianDigits('1405/04/28'))).toBe('1405/04/28')
  })
})

describe('Intl output parses back: the real editing round-trip', () => {
  // The field shows an Intl-formatted string; the user edits it in place and we
  // parse it again. If parsing cannot read our own output, editing a saved
  // receipt silently zeroes it.
  it('round-trips Persian formatting', () => {
    const shown = formatNumber(147_750_000, 'fa-IR')
    expect(shown).toBe('۱۴۷٬۷۵۰٬۰۰۰')
    expect(parseUserNumber(shown)).toBe(147_750_000)
  })

  it('round-trips English formatting', () => {
    const shown = formatNumber(147_750_000, 'en-US')
    expect(parseUserNumber(shown)).toBe(147_750_000)
  })

  it('round-trips Persian decimals through the Arabic decimal separator', () => {
    const shown = formatNumber(1500.5, 'fa-IR', 2)
    expect(shown).toBe('۱٬۵۰۰٫۵۰')
    expect(parseUserNumber(shown)).toBe(1500.5)
  })

  it('accepts a Persian-typed number while the interface is English', () => {
    // A Persian keyboard stays Persian regardless of the interface language.
    expect(parseUserNumber('۲۵۰۰')).toBe(2500)
  })
})
