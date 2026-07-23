import { describe, expect, it } from 'vitest'
import { numberToWords } from './words'

// The figure «به حروف» sits next to the figure in digits on a document people
// hand to an embassy. If the two disagree the whole page is worthless, so the
// interesting cases here are the ones that silently produce a wrong reading:
// internal zero groups, the teens, and round hundreds.
describe('numberToWords: Persian', () => {
  const fa = (value: number) => numberToWords(value, 'fa-IR')

  it('writes zero', () => {
    expect(fa(0)).toBe('صفر')
  })

  it('writes the teens as single words, not ten-and-x', () => {
    expect(fa(11)).toBe('یازده')
    expect(fa(19)).toBe('نوزده')
  })

  it('joins tens and ones with و', () => {
    expect(fa(21)).toBe('بیست و یک')
    expect(fa(95)).toBe('نود و پنج')
  })

  it('uses the irregular hundreds', () => {
    expect(fa(300)).toBe('سیصد')
    expect(fa(500)).toBe('پانصد')
    expect(fa(900)).toBe('نهصد')
  })

  it('writes a typical receipt amount', () => {
    expect(fa(12_500_000)).toBe('دوازده میلیون و پانصد هزار')
  })

  // 1_000_500 has an EMPTY thousands-of-thousands group. A naive implementation
  // emits «یک میلیون و صفر هزار و پانصد» or drops the scale entirely.
  it('skips empty groups rather than writing them out', () => {
    expect(fa(1_000_500)).toBe('یک میلیون و پانصد')
    expect(fa(2_000_000)).toBe('دو میلیون')
  })

  it('writes a full annual total', () => {
    expect(fa(649_980_000)).toBe('ششصد و چهل و نه میلیون و نهصد و هشتاد هزار')
  })

  it('reaches milliard', () => {
    expect(fa(1_200_000_000)).toBe('یک میلیارد و دویست میلیون')
  })

  it('rounds rather than spelling a fraction, because Toman has none', () => {
    expect(fa(1500.4)).toBe(fa(1500))
  })
})

describe('numberToWords: English', () => {
  const en = (value: number) => numberToWords(value, 'en-US')

  it('writes zero', () => {
    expect(en(0)).toBe('zero')
  })

  it('hyphenates compound tens', () => {
    expect(en(21)).toBe('twenty-one')
    expect(en(95)).toBe('ninety-five')
  })

  it('writes a typical receipt amount', () => {
    expect(en(12_500_000)).toBe('twelve million five hundred thousand')
  })

  it('skips empty groups', () => {
    expect(en(1_000_500)).toBe('one million five hundred')
  })

  it('writes a full annual total', () => {
    expect(en(649_980_000)).toBe('six hundred forty-nine million nine hundred eighty thousand')
  })
})
