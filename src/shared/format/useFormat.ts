import { useLingui } from '@lingui/react/macro'
import { useSettings } from 'src/core/query'
import type { Currency } from 'src/shared/types'
import { formatAmount, formatDate, formatDateLong, formatDateRangeLong, formatNumber, toPersianDigits } from 'src/shared/utils'

/**
 * Locale-aware number and date rendering.
 *
 * Persian numerals are a property of the Persian LOCALE, not of the app, so in
 * English the same figures read «649,980,000». Every surface that prints a
 * number or a date goes through this hook, which is what stops the two drifting
 * apart. Never call `toPersianDigits` from a component.
 */
export const useFormat = () => {
  const { locale, calendar } = useSettings()
  const { t, i18n } = useLingui()
  const persian = locale === 'fa-IR'

  return {
    /** True when the active locale renders Persian numerals. */
    persian,
    digits: (value: string | number) => (persian ? toPersianDigits(value) : String(value)),
    number: (value: number, decimals = 0) => formatNumber(value, locale, decimals),
    amount: (value: number, currency: Currency) => formatAmount(value, currency, locale),
    date: (iso: string) => formatDate(iso, calendar, persian),
    dateLong: (iso: string) => formatDateLong(iso, calendar, i18n, persian),
    /** A range with the shared year (and month) written only once. */
    dateRange: (fromIso: string, toIso: string) => formatDateRangeLong(fromIso, toIso, calendar, i18n, t`to`, persian),
  }
}
