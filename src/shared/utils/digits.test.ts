import { describe, expect, it } from 'vitest'
import { groupThousands, parseUserNumber, toEnglishDigits, toPersianDigits, toPersianLetters } from './digits'

// `money.test.ts` covers the strings that must parse. This file covers the ones
// that must NOT, and the keyboards that are not Persian.
//
// Every amount in the database came through `parseUserNumber`. A rejected
// string shows the user an error they can fix; a string that quietly becomes
// the wrong number becomes a receipt nobody will ever re-read, and from there
// it is in the total, the chart and the certificate.

describe('parseUserNumber — refuses to guess', () => {
  it('rejects a half-typed decimal rather than rounding it away', () => {
    // «۱۲٫» is mid-keystroke, not twelve. Returning 12 here would commit a
    // value the user was still in the middle of typing.
    expect(parseUserNumber('12.')).toBeNull()
    expect(parseUserNumber('.')).toBeNull()
    expect(parseUserNumber('1.2.3')).toBeNull()
  })

  it('rejects scientific notation, which Number() would read as 100,000', () => {
    expect(parseUserNumber('1e5')).toBeNull()
    expect(parseUserNumber('1E5')).toBeNull()
  })

  it('rejects a lone or doubled minus', () => {
    expect(parseUserNumber('-')).toBeNull()
    expect(parseUserNumber('--5')).toBeNull()
  })

  it('rejects text that merely contains digits', () => {
    // Pasting a whole line out of a bank SMS must fail loudly, not silently
    // yield the first number it can find.
    expect(parseUserNumber('۲۵۰۰ تومان')).toBeNull()
    expect(parseUserNumber('$500')).toBeNull()
    expect(parseUserNumber('500٪')).toBeNull()
  })

  it('rejects separators and whitespace with no digits behind them', () => {
    expect(parseUserNumber('   ')).toBeNull()
    expect(parseUserNumber(',,,')).toBeNull()
    expect(parseUserNumber('٬')).toBeNull()
  })
})

describe('parseUserNumber — zero and negatives are values, not absences', () => {
  it('parses zero as 0, which is not the same answer as null', () => {
    // The form distinguishes "nothing entered" from "zero entered" to decide
    // which error to show; collapsing them makes the message wrong.
    expect(parseUserNumber('0')).toBe(0)
    expect(parseUserNumber('۰')).toBe(0)
    expect(parseUserNumber('0.00')).toBe(0)
  })

  it('keeps the sign instead of dropping it', () => {
    expect(parseUserNumber('-500')).toBe(-500)
    expect(parseUserNumber('-۵۰۰')).toBe(-500)
  })
})

// Persian is not the only keyboard that produces non-ASCII digits. Arabic-Indic
// numerals (U+0660, 0669) look all but identical on screen and arrive from
// Arabic layouts and from text pasted out of a Gulf bank's message. If only the
// Persian range were folded, «٢٥٠٠» would parse to null and the user would see
// an amount field that refuses everything they type.
describe('Arabic-Indic input', () => {
  it('folds Arabic-Indic digits, not only Persian ones', () => {
    expect(toEnglishDigits('٢٥٠٠')).toBe('2500')
    expect(parseUserNumber('٢٥٠٠')).toBe(2500)
  })

  it('reads the Arabic decimal and thousands separators around them', () => {
    expect(parseUserNumber('١٢٬٥٠٠٫٥٠')).toBe(12500.5)
  })

  it('leaves everything that is not a digit exactly as it was', () => {
    expect(toEnglishDigits('کد ملی ۰۰۱۲۳۴۵۶۷۸')).toBe('کد ملی 0012345678')
  })
})

describe('toPersianDigits', () => {
  it('takes a number as readily as a string', () => {
    expect(toPersianDigits(1405)).toBe('۱۴۰۵')
  })

  it('converts only the digits, so the rest of the string survives intact', () => {
    expect(toPersianDigits('1405/04/28')).toBe('۱۴۰۵/۰۴/۲۸')
    expect(toPersianDigits('۱۴۰۵ تومان')).toBe('۱۴۰۵ تومان')
  })

  it('is a round trip with toEnglishDigits', () => {
    // The certificate normalises a stored profile field to ASCII and then
    // re-renders it in the document's own numerals; if that is not an identity
    // the national ID printed differs from the one the user typed.
    expect(toEnglishDigits(toPersianDigits('0012345678'))).toBe('0012345678')
  })
})

// Rule 5: Arabic letterforms must not leak into Persian text. They are
// different codepoints that render almost identically, so «كيف» passes a
// glance and then fails a search for «کیف».
describe('toPersianLetters', () => {
  it('folds the Arabic letterforms a Persian keyboard smuggles in', () => {
    expect(toPersianLetters('شركت كيان')).toBe('شرکت کیان')
    expect(toPersianLetters('مدرسة')).toBe('مدرسه')
  })
})

describe('groupThousands', () => {
  it('groups from the right, and leaves short numbers alone', () => {
    expect(groupThousands('12500000')).toBe('12,500,000')
    expect(groupThousands('999')).toBe('999')
    expect(groupThousands('0')).toBe('0')
  })
})
