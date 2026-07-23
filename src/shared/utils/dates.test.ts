import type { I18n } from '@lingui/core'
import { loadReportI18n } from 'src/core/i18n'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  averagingPeriod,
  dayRange,
  formatDate,
  formatDateEnglish,
  formatDateLong,
  formatDateRangeLong,
  isToday,
  monthBucketsOfYear,
  monthIndexOf,
  monthNames,
  monthsSpanned,
  yearOf,
  yearRange,
} from './dates'

// The Jalali boundary logic is the part most likely to be subtly wrong and
// least likely to be noticed, a year that starts in January instead of
// Farvardin produces totals that look plausible but are not the user's year.

describe('yearRange: Jalali years start at Farvardin, not January', () => {
  it('starts 1404 in March 2025, not January', () => {
    const { from } = yearRange(1404, 'JALALI')
    const start = new Date(from)
    expect(start.getFullYear()).toBe(2025)
    // Farvardin 1 falls on 20 or 21 March.
    expect(start.getMonth()).toBe(2)
    expect(start.getDate()).toBeGreaterThanOrEqual(20)
  })

  it('ends 1404 just before the next Farvardin', () => {
    const { to } = yearRange(1404, 'JALALI')
    const next = yearRange(1405, 'JALALI')
    expect(new Date(to).getTime()).toBeLessThan(new Date(next.from).getTime())
  })

  it('round-trips: every Jalali year range reports its own year', () => {
    for (const year of [1400, 1403, 1404, 1405, 1410]) {
      const { from, to } = yearRange(year, 'JALALI')
      expect(yearOf(new Date(from), 'JALALI')).toBe(year)
      expect(yearOf(new Date(to), 'JALALI')).toBe(year)
    }
  })

  it('uses January for Gregorian', () => {
    const { from } = yearRange(2025, 'GREGORIAN')
    expect(new Date(from).getMonth()).toBe(0)
    expect(new Date(from).getFullYear()).toBe(2025)
  })
})

describe('monthBucketsOfYear', () => {
  it('always returns twelve buckets, so empty months keep their zero bar', () => {
    expect(monthBucketsOfYear(1404, 'JALALI')).toHaveLength(12)
    expect(monthBucketsOfYear(2025, 'GREGORIAN')).toHaveLength(12)
  })

  it('produces contiguous, non-overlapping buckets', () => {
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    for (let index = 1; index < buckets.length; index += 1) {
      expect(new Date(buckets[index].from).getTime()).toBeGreaterThan(new Date(buckets[index - 1].to).getTime())
    }
  })

  it('covers the whole year', () => {
    const year = yearRange(1404, 'JALALI')
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    expect(new Date(buckets[0].from).getTime()).toBeLessThanOrEqual(new Date(year.from).getTime() + 1000)
    expect(new Date(buckets[11].to).getTime()).toBeGreaterThanOrEqual(new Date(year.to).getTime() - 1000)
  })
})

describe('monthsSpanned: the denominator of the monthly average', () => {
  it('counts a full year as twelve months', () => {
    expect(monthsSpanned(yearRange(1404, 'JALALI'), 'JALALI')).toBe(12)
  })

  it('counts elapsed months, not months that had income', () => {
    // Farvardin through Khordad is three months, whether or not all three earned.
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    const range = { from: buckets[0].from, to: buckets[2].to }
    expect(monthsSpanned(range, 'JALALI')).toBe(3)
  })

  it('never returns zero, so the average can never divide by zero', () => {
    const now = new Date().toISOString()
    expect(monthsSpanned({ from: now, to: now }, 'JALALI')).toBe(1)
  })
})

// `averagingPeriod` is the single rule behind every "monthly average" the app
// shows. Two bugs came from not having one: the ledger divided by the span
// between the first and last receipt (inflating a clustered year fourfold) and
// the report divided a year still in progress by twelve (understating four
// real months threefold on the document that goes to an embassy).
describe('averagingPeriod: one rule for every monthly average', () => {
  const AT_TIR_31 = new Date('2026-07-22T09:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AT_TIR_31)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('divides a COMPLETED year by twelve', () => {
    expect(averagingPeriod(yearRange(1404, 'JALALI'), 'JALALI').months).toBe(12)
  })

  it('divides a year still in progress by the months actually elapsed', () => {
    // 1405 began at Farvardin; the fake clock sits in Tir, the fourth month.
    const { months, range } = averagingPeriod(yearRange(1405, 'JALALI'), 'JALALI')
    expect(months).toBe(4)
    // The period is reported as ending today, not at Esfand, a certificate
    // must not claim to cover months that have not happened.
    expect(new Date(range.to).getTime()).toBe(AT_TIR_31.getTime())
  })

  it('leaves a range that already ended in the past untouched', () => {
    const year = yearRange(1404, 'JALALI')
    expect(averagingPeriod(year, 'JALALI').range.to).toBe(year.to)
  })

  it('counts quiet months since the last receipt, which is what the ledger got wrong', () => {
    // Income in Farvardin only, read in Tir: four months elapsed, not one.
    const buckets = monthBucketsOfYear(1405, 'JALALI')
    expect(averagingPeriod({ from: buckets[0].from, to: new Date().toISOString() }, 'JALALI').months).toBe(4)
  })

  it('never divides by zero', () => {
    const now = new Date().toISOString()
    expect(averagingPeriod({ from: now, to: now }, 'JALALI').months).toBe(1)
  })

  it('does not invert when the period has not started yet', () => {
    const next = yearRange(1406, 'JALALI')
    const { range } = averagingPeriod(next, 'JALALI')
    expect(new Date(range.to).getTime()).toBeGreaterThanOrEqual(new Date(range.from).getTime())
  })
})

// Everything below is display. None of it can throw, a mistake here prints a
// date that is off by a month, or Persian numerals on an English certificate,
// and the page still looks finished on its way to an embassy.

const at = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day, 12).toISOString()

// 1 August 2026 is 10 Mordad 1405; 1 December 2025 is still 1404.
const AUG_1 = at(2026, 7, 1)
const AUG_15 = at(2026, 7, 15)
const APR_10 = at(2026, 3, 10)
const AUG_1_2025 = at(2025, 7, 1)
const DEC_1_2025 = at(2025, 11, 1)

let fa: I18n
let en: I18n

beforeAll(async () => {
  // Two independent instances, exactly as the app uses them: the interface's
  // and the report's.
  fa = await loadReportI18n('fa-IR')
  en = await loadReportI18n('en-US')
})

describe('formatDate: the ledger column', () => {
  it('prints the Jalali date in Persian numerals', () => {
    expect(formatDate(AUG_1, 'JALALI')).toBe('۱۴۰۵/۰۵/۱۰')
  })

  it('prints the same instant Gregorian when the calendar setting says so', () => {
    expect(formatDate(AUG_1, 'GREGORIAN', false)).toBe('2026/08/01')
  })

  it('keeps Latin digits when asked, which is what English mode asks for', () => {
    // Persian numerals leaking into English shipped as a live bug once.
    expect(formatDate(AUG_1, 'JALALI', false)).toBe('1405/05/10')
  })
})

describe('formatDateLong', () => {
  it('names the JALALI month, not the Gregorian one at the same instant', () => {
    expect(formatDateLong(AUG_1, 'JALALI', fa)).toBe('۱۰ مرداد ۱۴۰۵')
  })

  it('reads December back into the previous Jalali year', () => {
    // The Farvardin boundary again: 2025 and 1404 do not line up.
    expect(formatDateLong(DEC_1_2025, 'JALALI', fa)).toBe('۱۰ آذر ۱۴۰۴')
  })

  it('uses Gregorian names and Latin digits for the English document', () => {
    expect(formatDateLong(AUG_1, 'GREGORIAN', en, false)).toBe('1 August 2026')
  })
})

describe('formatDateEnglish', () => {
  it('is Gregorian and Latin whatever else is going on', () => {
    // This is the one the English certificate calls while the app around it is
    // still Persian.
    expect(formatDateEnglish(AUG_1)).toBe('01 Aug 2026')
    expect(formatDateEnglish(AUG_1)).not.toMatch(/[۰-۹]/)
  })
})

// The collapsing rule from AGENTS.md. What it guards against is not ugliness:
// «۱۴۰۵ تا ۱۴۰۵» makes a reader stop and check whether the two ends are
// actually different years, on a line whose whole job is to be unambiguous.
describe('formatDateRangeLong: shared parts written once', () => {
  it('drops the month AND the year from the opening date inside one month', () => {
    expect(formatDateRangeLong(AUG_1, AUG_15, 'JALALI', fa, 'تا')).toBe('۱۰ تا ۲۴ مرداد ۱۴۰۵')
  })

  it('keeps the opening month but drops the year inside one year', () => {
    expect(formatDateRangeLong(APR_10, AUG_1, 'JALALI', fa, 'تا')).toBe('۲۱ فروردین تا ۱۰ مرداد ۱۴۰۵')
  })

  it('spells both ends out when the range really crosses a year', () => {
    expect(formatDateRangeLong(DEC_1_2025, AUG_1, 'JALALI', fa, 'تا')).toBe('۱۰ آذر ۱۴۰۴ تا ۱۰ مرداد ۱۴۰۵')
  })

  it('does not collapse a shared month INDEX across two years', () => {
    // Mordad 1404 to Mordad 1405 is twelve months, not fourteen days. Testing
    // month equality without year equality would print «۱۰ تا ۱۰ مرداد ۱۴۰۵».
    expect(formatDateRangeLong(AUG_1_2025, AUG_1, 'JALALI', fa, 'تا')).toBe('۱۰ مرداد ۱۴۰۴ تا ۱۰ مرداد ۱۴۰۵')
  })

  it('collapses the English range too, in Latin digits', () => {
    expect(formatDateRangeLong(APR_10, AUG_1, 'GREGORIAN', en, 'to', false)).toBe('10 April to 1 August 2026')
  })
})

describe('isToday: the switch behind the backdating warning', () => {
  const today = (hours: number, minutes = 0, seconds = 0, ms = 0) => {
    const date = new Date()
    date.setHours(hours, minutes, seconds, ms)
    return date.toISOString()
  }

  it('accepts both edges of today, not just the middle of it', () => {
    // A receipt logged at 23:59 is still today's, and must not make the form
    // claim it is backdated.
    expect(isToday(today(0))).toBe(true)
    expect(isToday(today(23, 59, 59, 999))).toBe(true)
  })

  it('rejects yesterday, which is what relabels the rate field', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)
    expect(isToday(yesterday.toISOString())).toBe(false)
  })

  it('rejects scenario 5, a receipt from two months ago', () => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    expect(isToday(twoMonthsAgo.toISOString())).toBe(false)
  })
})

describe('dayRange', () => {
  it('spans exactly one whole local day from any instant inside it', () => {
    const { from, to } = dayRange(new Date(2026, 7, 1, 15, 42))
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(24 * 60 * 60 * 1000 - 1)
  })
})

describe('month names and indexes line up', () => {
  it('starts the Jalali year at Farvardin and ends it at Esfand', () => {
    expect(monthNames('JALALI', fa)).toHaveLength(12)
    expect(monthNames('JALALI', fa)[0]).toBe('فروردین')
    expect(monthNames('JALALI', fa)[11]).toBe('اسفند')
  })

  it('names the month an instant actually falls in, per calendar', () => {
    // The same instant is Mordad and August. An index taken from one calendar
    // and a name list from the other is off by five months and still plausible.
    expect(monthNames('JALALI', fa)[monthIndexOf(new Date(AUG_1), 'JALALI')]).toBe('مرداد')
    expect(monthNames('GREGORIAN', en)[monthIndexOf(new Date(AUG_1), 'GREGORIAN')]).toBe('August')
  })

  it('takes its i18n instance, so the PDF can be English while the app stays Persian', () => {
    expect(monthNames('JALALI', en)[0]).toBe('Farvardin')
  })
})

describe('yearOf', () => {
  it('reads the Gregorian year as well as the Jalali one', () => {
    expect(yearOf(new Date(AUG_1), 'GREGORIAN')).toBe(2026)
    expect(yearOf(new Date(AUG_1), 'JALALI')).toBe(1405)
  })
})
