// Persian/Arabic-Indic digit handling.
//
// Rule 3 of the brief: numbers display as Persian digits, but the input must
// accept both Persian and English keyboards and normalise on save. Rule 5
// additionally forbids Arabic «ي»/«ك» leaking into Persian text.

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

/** English digits → Persian. Used only at the display boundary. */
export const toPersianDigits = (input: string | number): string => String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])

/**
 * Persian and Arabic-Indic digits → English, plus the Arabic decimal separator.
 * Every value entering the database goes through this.
 */
export const toEnglishDigits = (input: string): string => {
  let out = ''
  for (const char of input) {
    const persian = PERSIAN_DIGITS.indexOf(char)
    if (persian !== -1) {
      out += String(persian)
      continue
    }
    const arabic = ARABIC_INDIC_DIGITS.indexOf(char)
    if (arabic !== -1) {
      out += String(arabic)
      continue
    }
    // Arabic decimal separator and thousands separator.
    if (char === '٫') {
      out += '.'
      continue
    }
    if (char === '٬') {
      continue
    }
    out += char
  }
  return out
}

/**
 * Folds the Arabic letterforms that pasted text and non-Iranian keyboards bring
 * in: ي to ی, ك to ک, ة to ه. The pairs look identical on screen and sort
 * differently, so anything used as a key goes through here first.
 */
export const toPersianLetters = (input: string): string => input.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه')

/**
 * Parses user-typed numeric input into a number, tolerating Persian digits,
 * thousands separators and stray whitespace. Returns null when the text is not
 * a usable number, so callers can show a real error instead of storing NaN.
 */
export const parseUserNumber = (input: string): number | null => {
  const normalised = toEnglishDigits(input)
    .replace(/[,٬\s]/g, '')
    .trim()
  if (!normalised || !/^-?\d*\.?\d+$/.test(normalised)) {
    return null
  }
  const value = Number(normalised)
  return Number.isFinite(value) ? value : null
}

/** Groups an integer part with thousands separators, before digit conversion. */
export const groupThousands = (input: string): string => input.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
