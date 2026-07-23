import { currencyDecimals, type AppLocale, type Currency } from 'src/shared/types'

// Number formatting is delegated to `Intl.NumberFormat`, which knows each
// locale's own conventions: fa-IR renders «۱۴۷٬۷۵۰٬۰۰۰» with the Arabic
// thousands separator (U+066C) and «٫» for decimals, en-US renders
// «147,750,000». Hand-rolled grouping produced Latin commas with Persian
// digits, which is a mix no Persian reader actually writes.
//
// Formatters are cached because constructing one is comparatively expensive and
// the ledger builds thousands of strings while scrolling.
const formatterCache = new Map<string, Intl.NumberFormat>()

const formatter = (locale: AppLocale, decimals: number): Intl.NumberFormat => {
  const key = `${locale}:${decimals}`
  let cached = formatterCache.get(key)
  if (!cached) {
    cached = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    formatterCache.set(key, cached)
  }
  return cached
}

/**
 * The single place toman is computed. Rounded to a whole number because toman
 * has no sub-unit, and called exactly once per receipt, at write time, so the
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

/** Formats a number in the given locale's numbering system and grouping. */
export const formatNumber = (value: number, locale: AppLocale, decimals = 0): string => formatter(locale, decimals).format(value)

/** Formats an amount with its currency's decimal count, without a unit label. */
export const formatAmount = (value: number, currency: Currency, locale: AppLocale): string =>
  formatNumber(value, locale, currencyDecimals[currency])
