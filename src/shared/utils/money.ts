import { currencyDecimals, type Currency } from 'src/shared/types'
import { groupThousands, toPersianDigits } from './digits'

// Money formatting. Rule 3: «۱۲٬۵۰۰٬۰۰۰ تومان» — Persian digits, three-digit
// grouping. Toman has no decimals; USD and USDT have two.

/**
 * The single place toman is computed. Rounded to a whole number because toman
 * has no sub-unit, and called exactly once per receipt — at write time — so the
 * stored value is frozen against later rate changes.
 */
export const computeToman = (amountOriginal: number, currency: Currency, rate: number | null): number => {
  if (currency === 'TOMAN') {
    return Math.round(amountOriginal)
  }
  if (rate === null || !Number.isFinite(rate)) {
    return 0
  }
  return Math.round(amountOriginal * rate)
}

/** Formats a number with grouping and the right decimal count, in Latin digits. */
export const formatNumberLatin = (value: number, decimals = 0): string => {
  const fixed = Math.abs(value).toFixed(decimals)
  const [whole, fraction] = fixed.split('.')
  const grouped = groupThousands(whole)
  const sign = value < 0 ? '-' : ''
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`
}

/** Formats a number with grouping, in Persian digits. */
export const formatNumberPersian = (value: number, decimals = 0): string => toPersianDigits(formatNumberLatin(value, decimals))

/** «۱۲٬۵۰۰٬۰۰۰ تومان» — the canonical money rendering for the Persian UI. */
export const formatToman = (value: number): string => `${formatNumberPersian(value)} تومان`

/** Formats an amount in its own currency, with that currency's decimal count. */
export const formatAmount = (value: number, currency: Currency, persian = true): string => {
  const decimals = currencyDecimals[currency]
  return persian ? formatNumberPersian(value, decimals) : formatNumberLatin(value, decimals)
}

/** Latin-digit toman, for the English report where Persian digits would be unreadable. */
export const formatTomanLatin = (value: number): string => `${formatNumberLatin(value)} Toman`
