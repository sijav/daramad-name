import { describe, expect, it } from 'vitest'
import { parseUserNumber, toEnglishDigits, toPersianDigits } from './digits'
import { computeToman, formatToman } from './money'

// These cover the rules that would be silently, permanently wrong if broken —
// a wrong total in a financial tool is worse than a crash, because nobody notices.

describe('computeToman — the freeze rule', () => {
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

describe('formatToman', () => {
  it('groups by three and uses Persian digits', () => {
    expect(formatToman(12_500_000)).toBe('۱۲,۵۰۰,۰۰۰ تومان')
  })

  it('renders an empty month as ۰ rather than blank', () => {
    expect(formatToman(0)).toBe('۰ تومان')
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
