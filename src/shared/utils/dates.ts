import type { I18n } from '@lingui/core'
import {
  addMonths,
  endOfDay,
  endOfMonth,
  endOfYear,
  format as formatGregorian,
  getMonth,
  getYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import {
  addMonths as addMonthsJalali,
  endOfMonth as endOfMonthJalali,
  endOfYear as endOfYearJalali,
  format as formatJalali,
  getMonth as getMonthJalali,
  getYear as getYearJalali,
  startOfMonth as startOfMonthJalali,
  startOfYear as startOfYearJalali,
} from 'date-fns-jalali'
import { GREGORIAN_MONTH_LABELS, JALALI_MONTH_LABELS } from 'src/shared/constants'
import type { CalendarSystem, DateRange } from 'src/shared/types'
import { toPersianDigits } from './digits'

// Calendar handling. Receipts are stored as ISO-8601 instants; the calendar is
// purely a presentation and bucketing concern, switchable in Settings.
//
// Everything the charts and reports do is expressed as "which 12 buckets does
// this year have", so the Jalali/Gregorian split lives entirely in this file.

/**
 * Month names for the active locale.
 *
 * Takes an `I18n` instance rather than reading a global, so the PDF can render
 * English month names from its own isolated instance while the interface stays
 * Persian.
 */
export const monthNames = (calendar: CalendarSystem, i18n: I18n): string[] =>
  (calendar === 'JALALI' ? JALALI_MONTH_LABELS : GREGORIAN_MONTH_LABELS).map((descriptor) => i18n._(descriptor))

export const yearOf = (date: Date, calendar: CalendarSystem): number => (calendar === 'JALALI' ? getYearJalali(date) : getYear(date))

/** Month index, 0-11, in the given calendar. */
export const monthIndexOf = (date: Date, calendar: CalendarSystem): number =>
  calendar === 'JALALI' ? getMonthJalali(date) : getMonth(date)

/**
 * The full year as an inclusive instant range. Jalali years start at Farvardin
 * 1, not January, the edge case the brief calls out explicitly.
 */
export const yearRange = (year: number, calendar: CalendarSystem): DateRange => {
  if (calendar === 'JALALI') {
    // date-fns-jalali reads the Jalali year off a Date, so seed from any
    // instant inside the target year and let it snap to the boundaries.
    const seed = jalaliYearSeed(year)
    return {
      from: startOfYearJalali(seed).toISOString(),
      to: endOfYearJalali(seed).toISOString(),
    }
  }
  const seed = new Date(year, 5, 1)
  return { from: startOfYear(seed).toISOString(), to: endOfYear(seed).toISOString() }
}

/**
 * Produces a Date guaranteed to fall inside the given Jalali year.
 * Jalali year N starts around March (N + 621) in the Gregorian calendar, so
 * mid-summer of that Gregorian year is always safely inside it.
 */
const jalaliYearSeed = (jalaliYear: number): Date => {
  const approximate = new Date(jalaliYear + 621, 6, 1)
  const drift = getYearJalali(approximate) - jalaliYear
  return drift === 0 ? approximate : new Date(jalaliYear + 621 - drift, 6, 1)
}

/** The 12 month buckets of a year, as inclusive instant ranges, in calendar order. */
export const monthBucketsOfYear = (year: number, calendar: CalendarSystem): DateRange[] => {
  const { from } = yearRange(year, calendar)
  const first = new Date(from)
  const add = calendar === 'JALALI' ? addMonthsJalali : addMonths
  const startOfM = calendar === 'JALALI' ? startOfMonthJalali : startOfMonth
  const endOfM = calendar === 'JALALI' ? endOfMonthJalali : endOfMonth
  return Array.from({ length: 12 }, (_unused, index) => {
    const inMonth = add(first, index)
    return { from: startOfM(inMonth).toISOString(), to: endOfM(inMonth).toISOString() }
  })
}

/**
 * How many calendar months a range spans, minimum 1.
 *
 * Prefer `averagingPeriod` for anything the user sees, this is the raw span
 * and does not clamp a range that runs into the future.
 */
export const monthsSpanned = (range: DateRange, calendar: CalendarSystem): number => {
  const from = new Date(range.from)
  const to = new Date(range.to)
  const yearDelta = yearOf(to, calendar) - yearOf(from, calendar)
  const monthDelta = monthIndexOf(to, calendar) - monthIndexOf(from, calendar)
  return Math.max(1, yearDelta * 12 + monthDelta + 1)
}

/**
 * THE rule behind every "monthly average" in the app.
 *
 * One definition for the report, the ledger and the dashboard: total divided by
 * the calendar months of the period on screen, never running past today,
 * minimum one. Every surface prints the divisor beside the figure.
 *
 * Two bugs came from not having it in one place. The ledger divided by the span
 * between the first and last receipt, so three earning months out of twelve
 * showed an average four times the report's under the same label. The report
 * divided a year still in progress by 12, understating four months of income
 * threefold.
 *
 * Returns the clamped period as well, so callers bucket and label against the
 * range they divided by instead of deriving it a second time.
 */
export const averagingPeriod = (range: DateRange, calendar: CalendarSystem): { range: DateRange; months: number } => {
  const now = new Date().toISOString()
  const capped = range.to > now ? now : range.to
  // A range starting in the future would invert once capped; keep it empty
  // rather than backwards.
  const clamped: DateRange = { from: range.from, to: capped < range.from ? range.from : capped }
  return { range: clamped, months: monthsSpanned(clamped, calendar) }
}

/** «۱۴۰۴/۰۵/۲۳», the ledger's date column. */
export const formatDate = (iso: string, calendar: CalendarSystem, persianDigits = true): string => {
  const date = new Date(iso)
  const formatted = calendar === 'JALALI' ? formatJalali(date, 'yyyy/MM/dd') : formatGregorian(date, 'yyyy/MM/dd')
  return persianDigits ? toPersianDigits(formatted) : formatted
}

/** «۲۳ مرداد ۱۴۰۴», for report headers and the receipt detail. */
export const formatDateLong = (iso: string, calendar: CalendarSystem, i18n: I18n, persianDigits = true): string => {
  const date = new Date(iso)
  const day = calendar === 'JALALI' ? formatJalali(date, 'd') : formatGregorian(date, 'd')
  const month = monthNames(calendar, i18n)[monthIndexOf(date, calendar)]
  const year = yearOf(date, calendar)
  const digits = (value: string | number) => (persianDigits ? toPersianDigits(value) : String(value))
  return `${digits(day)} ${month} ${digits(year)}`
}

/** Gregorian, Latin digits, the English report must not use Persian digits. */
export const formatDateEnglish = (iso: string): string => formatGregorian(new Date(iso), 'dd MMM yyyy')

/** True when the instant falls on today's date, used to decide the rate-field wording. */
export const isToday = (iso: string): boolean => {
  const date = new Date(iso)
  const now = new Date()
  return date >= startOfDay(now) && date <= endOfDay(now)
}

/** The calendar day `at` falls in, as a range, "what came in today". */
export const dayRange = (at: Date): DateRange => ({
  from: startOfDay(at).toISOString(),
  to: endOfDay(at).toISOString(),
})

/**
 * «۱ فروردین تا ۲۹ اسفند ۱۴۰۵», a range with the repeated parts dropped.
 *
 * The design prints the year once when both ends share it, and drops the month
 * from the opening date when they share that too. Writing «۱۴۰۵» twice in one
 * line is noise: the reader only needs telling when the range actually crosses
 * a boundary, and seeing it repeat invites a second look to check they are not
 * different years.
 */
export const formatDateRangeLong = (
  fromIso: string,
  toIso: string,
  calendar: CalendarSystem,
  i18n: I18n,
  separator: string,
  persianDigits = true,
): string => {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  const digits = (value: string | number) => (persianDigits ? toPersianDigits(value) : String(value))
  const dayOf = (date: Date) => digits(calendar === 'JALALI' ? formatJalali(date, 'd') : formatGregorian(date, 'd'))

  const names = monthNames(calendar, i18n)
  const sameYear = yearOf(from, calendar) === yearOf(to, calendar)
  const sameMonth = sameYear && monthIndexOf(from, calendar) === monthIndexOf(to, calendar)

  const tail = formatDateLong(toIso, calendar, i18n, persianDigits)
  if (!sameYear) {
    return `${formatDateLong(fromIso, calendar, i18n, persianDigits)} ${separator} ${tail}`
  }

  const head = sameMonth ? dayOf(from) : `${dayOf(from)} ${names[monthIndexOf(from, calendar)]}`
  return `${head} ${separator} ${tail}`
}
