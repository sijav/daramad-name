import { currencyDecimals, type Currency } from 'src/shared/types'
import { groupThousands, toPersianDigits } from './digits'

// Number formatting only. The «تومان» unit is a translatable label and lives in
// the i18n catalogs — components render it with `<Trans>`, and the PDF resolves
// it through its own i18n instance. Keeping this module free of UI strings also
// keeps it directly unit-testable without an i18n context.

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

/** Formats an amount in its own currency's decimal count, without a unit label. */
export const formatAmount = (value: number, currency: Currency, persian = true): string => {
  const decimals = currencyDecimals[currency]
  return persian ? formatNumberPersian(value, decimals) : formatNumberLatin(value, decimals)
}
