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
import type { CalendarSystem, DateRange } from 'src/shared/types'
import { toPersianDigits } from './digits'

// Calendar handling. Receipts are stored as ISO-8601 instants; the calendar is
// purely a presentation and bucketing concern, switchable in Settings.
//
// Everything the charts and reports do is expressed as "which 12 buckets does
// this year have", so the Jalali/Gregorian split lives entirely in this file.

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

export const GREGORIAN_MONTHS_FA = [
  'ژانویه',
  'فوریه',
  'مارس',
  'آوریل',
  'مه',
  'ژوئن',
  'ژوئیه',
  'اوت',
  'سپتامبر',
  'اکتبر',
  'نوامبر',
  'دسامبر',
] as const

export const monthNames = (calendar: CalendarSystem): readonly string[] => (calendar === 'JALALI' ? JALALI_MONTHS : GREGORIAN_MONTHS_FA)

/** Year number in the given calendar. 1404 for Jalali, 2025 for Gregorian. */
export const yearOf = (date: Date, calendar: CalendarSystem): number => (calendar === 'JALALI' ? getYearJalali(date) : getYear(date))

/** Month index, 0-11, in the given calendar. */
export const monthIndexOf = (date: Date, calendar: CalendarSystem): number =>
  calendar === 'JALALI' ? getMonthJalali(date) : getMonth(date)

/**
 * The full year as an inclusive instant range. Jalali years start at Farvardin
 * 1, not January — the edge case the brief calls out explicitly.
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
 * How many calendar months a range spans, minimum 1. This is the denominator
 * for "monthly average" on the income report: total over months elapsed, not
 * over months that happened to have income — a freelancer with income in 3 of
 * 12 months has a low average, and inflating it would misrepresent the report.
 */
export const monthsSpanned = (range: DateRange, calendar: CalendarSystem): number => {
  const from = new Date(range.from)
  const to = new Date(range.to)
  const yearDelta = yearOf(to, calendar) - yearOf(from, calendar)
  const monthDelta = monthIndexOf(to, calendar) - monthIndexOf(from, calendar)
  return Math.max(1, yearDelta * 12 + monthDelta + 1)
}

/** «۱۴۰۴/۰۵/۲۳» — the ledger's date column. */
export const formatDate = (iso: string, calendar: CalendarSystem): string => {
  const date = new Date(iso)
  const formatted = calendar === 'JALALI' ? formatJalali(date, 'yyyy/MM/dd') : formatGregorian(date, 'yyyy/MM/dd')
  return toPersianDigits(formatted)
}

/** «۲۳ مرداد ۱۴۰۴» — for report headers and the receipt detail. */
export const formatDateLong = (iso: string, calendar: CalendarSystem): string => {
  const date = new Date(iso)
  const day = calendar === 'JALALI' ? formatJalali(date, 'd') : formatGregorian(date, 'd')
  const month = monthNames(calendar)[monthIndexOf(date, calendar)]
  const year = yearOf(date, calendar)
  return `${toPersianDigits(day)} ${month} ${toPersianDigits(year)}`
}

/** Gregorian, Latin digits — the English report must not use Persian digits. */
export const formatDateEnglish = (iso: string): string => formatGregorian(new Date(iso), 'dd MMM yyyy')

/** `yyyy-MM-dd` for the native date input, which only speaks Gregorian ISO. */
export const toDateInputValue = (iso: string): string => formatGregorian(new Date(iso), 'yyyy-MM-dd')

/** Whole-day range, so a filter's end date includes everything recorded that day. */
export const inclusiveDayRange = (fromIso: string, toIso: string): DateRange => ({
  from: startOfDay(new Date(fromIso)).toISOString(),
  to: endOfDay(new Date(toIso)).toISOString(),
})

/** True when the instant falls on today's date, used to decide the rate-field wording. */
export const isToday = (iso: string): boolean => {
  const date = new Date(iso)
  const now = new Date()
  return date >= startOfDay(now) && date <= endOfDay(now)
}
