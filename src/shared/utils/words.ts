import type { AppLocale } from 'src/shared/types'

// Amounts written out in words.
//
// Every Iranian financial document that matters, a cheque, a contract, a
// receipt, states its figure twice: once in digits and once «به حروف». It is
// the convention that makes a page read as a financial instrument rather than
// a printout, and it exists because words cannot be altered by adding a zero.
// The income certificate does the same, in whichever language it is issued.
//
// The word tables below are a numeral system, not user-facing copy, the same
// category as the codepoint tables in `digits.ts`, and exempt from the lingui
// rule for the same reason. Translating «هزار» through a message catalog would
// be translating an algorithm's alphabet.

const FA_ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const FA_TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const FA_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const FA_HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
const FA_SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'هزار میلیارد']
const FA_ZERO = 'صفر'
const FA_AND = ' و '

const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const EN_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const EN_SCALES = ['', 'thousand', 'million', 'billion', 'trillion']
const EN_ZERO = 'zero'

/** Splits into groups of three, least-significant first: 12_500_000 -> [0, 500, 12]. */
const groupsOfThree = (value: number): number[] => {
  const groups: number[] = []
  let rest = value
  while (rest > 0) {
    groups.push(rest % 1000)
    rest = Math.floor(rest / 1000)
  }
  return groups
}

const persianTriplet = (value: number): string => {
  const parts: string[] = []
  const hundreds = Math.floor(value / 100)
  const rest = value % 100

  if (hundreds > 0) {
    parts.push(FA_HUNDREDS[hundreds])
  }
  if (rest >= 10 && rest < 20) {
    parts.push(FA_TEENS[rest - 10])
  } else {
    const tens = Math.floor(rest / 10)
    const ones = rest % 10
    if (tens > 0) {
      parts.push(FA_TENS[tens])
    }
    if (ones > 0) {
      parts.push(FA_ONES[ones])
    }
  }

  return parts.join(FA_AND)
}

const englishTriplet = (value: number): string => {
  const parts: string[] = []
  const hundreds = Math.floor(value / 100)
  const rest = value % 100

  if (hundreds > 0) {
    parts.push(`${EN_ONES[hundreds]} hundred`)
  }
  if (rest >= 10 && rest < 20) {
    parts.push(EN_TEENS[rest - 10])
  } else {
    const tens = Math.floor(rest / 10)
    const ones = rest % 10
    if (tens > 0 && ones > 0) {
      parts.push(`${EN_TENS[tens]}-${EN_ONES[ones]}`)
    } else if (tens > 0) {
      parts.push(EN_TENS[tens])
    } else if (ones > 0) {
      parts.push(EN_ONES[ones])
    }
  }

  return parts.join(' ')
}

/**
 * Writes a whole, non-negative amount in words.
 *
 * Toman has no decimal part, so fractions are rounded away rather than
 * spelled, a certificate never needs to say «و پنجاه صدم».
 */
export const numberToWords = (value: number, locale: AppLocale): string => {
  const whole = Math.max(0, Math.round(value))
  const persian = locale === 'fa-IR'

  if (whole === 0) {
    return persian ? FA_ZERO : EN_ZERO
  }

  const scales = persian ? FA_SCALES : EN_SCALES
  const triplet = persian ? persianTriplet : englishTriplet
  const groups = groupsOfThree(whole)

  // Beyond the largest named scale the words stop meaning anything, so fall
  // back to nothing rather than printing a wrong figure on a document.
  if (groups.length > scales.length) {
    return ''
  }

  const parts = groups
    .map((group, index) => {
      if (group === 0) {
        return ''
      }
      const words = triplet(group)
      return scales[index] ? `${words} ${scales[index]}` : words
    })
    .filter(Boolean)
    .reverse()

  return parts.join(persian ? FA_AND : ' ')
}
