import { QueryClient } from '@tanstack/react-query'
import { getIncomeReportQueryKey } from 'src/shared/queries'
import type { IncomeReport } from 'src/shared/types'
import { monthIndexOf, yearOf, yearRange } from 'src/shared/utils'
import { describe, expect, it } from 'vitest'
import { FIXTURE_MONTHS, FIXTURE_YEARS, seedPageData } from './fixtures'

// The stories are where the certificate is read and where its PDF is taken
// from, so a fixture that does not add up ships a document that does not add
// up. It did: twelve month rows — four of them in months that had not happened
// — summed into a total and then divided by the five months elapsed.
//
// A reader must be able to check the arithmetic on the page. These assertions
// are that check.

const CALENDAR = 'JALALI' as const

const seededReport = (): IncomeReport => {
  const client = new QueryClient()
  seedPageData(client)
  const year = yearOf(new Date(), CALENDAR)
  return client.getQueryData(getIncomeReportQueryKey(yearRange(year, CALENDAR), CALENDAR)) as IncomeReport
}

describe('seedPageData — the report it seeds', () => {
  it('totals exactly the months it lists', () => {
    const report = seededReport()
    const summed = report.months.reduce((sum, month) => sum + month.totalToman, 0)

    expect(summed).toBe(report.totalToman)
  })

  it('divides by as many months as it lists', () => {
    const report = seededReport()

    expect(report.monthsInRange).toBe(report.months.length)
  })

  it('states an average that is the total over that count', () => {
    const report = seededReport()

    expect(report.monthlyAverageToman).toBe(Math.round(report.totalToman / report.monthsInRange))
  })

  it('never lists a month that has not happened yet', () => {
    const report = seededReport()
    const elapsed = monthIndexOf(new Date(), CALENDAR) + 1

    for (const month of report.months) {
      expect(month.month).toBeLessThanOrEqual(elapsed)
    }
  })

  it('ends the reporting period no later than today', () => {
    const report = seededReport()

    expect(report.range.to <= new Date().toISOString()).toBe(true)
  })
})

describe('FIXTURE_MONTHS', () => {
  const years = FIXTURE_YEARS(yearOf(new Date(), CALENDAR))

  // Toman is quoted to the ten thousand. A figure like ۲۲٬۳۴۷٬۸۹۱ is not an
  // amount anyone is paid, and the year scaling is the place it would creep in.
  it('quotes every month in whole ten-thousands, in every year', () => {
    for (const year of years) {
      for (const month of FIXTURE_MONTHS(year)) {
        expect(month.totalToman % 10_000).toBe(0)
      }
    }
  })

  // The PRECISION of a payment follows a power law: a round million is
  // ordinary, a half million happens, a hundred thousand is unusual, and an
  // exact ten thousand is rare enough to notice. A column where every figure is
  // round looks as invented as one where every figure is uneven.
  const precisionOf = (toman: number): string => {
    if (toman % 1_000_000 === 0) return 'common'
    if (toman % 500_000 === 0) return 'uncommon'
    if (toman % 100_000 === 0) return 'rare'
    if (toman % 10_000 === 0) return 'legendary'
    return 'finer than Toman is ever quoted'
  }

  it('quotes amounts at rarer precisions progressively less often', () => {
    const tally = FIXTURE_MONTHS(years[0]).reduce<Record<string, number>>((counts, month) => {
      const tier = precisionOf(month.totalToman)
      return { ...counts, [tier]: (counts[tier] ?? 0) + 1 }
    }, {})

    expect(tally.common).toBeGreaterThan(tally.uncommon ?? 0)
    expect(tally.uncommon ?? 0).toBeGreaterThanOrEqual(tally.rare ?? 0)
    expect(tally.rare ?? 0).toBeGreaterThanOrEqual(tally.legendary ?? 0)
    expect(tally.common).toBeGreaterThanOrEqual(8)
  })

  it('never quotes finer than a ten thousand, in any year', () => {
    for (const year of years) {
      for (const month of FIXTURE_MONTHS(year)) {
        expect(precisionOf(month.totalToman)).not.toBe('finer than Toman is ever quoted')
      }
    }
  })

  it('carries four years of history', () => {
    expect(years).toHaveLength(4)
    expect(years.at(-1)).toBe(years[0] - 3)
  })

  // Roughly half the months hold a single receipt, several hold two, and a
  // couple of good months hold four or five. A column of identical counts is
  // the first thing that makes a ledger look fabricated.
  it('spreads the receipt counts instead of repeating one', () => {
    const counts = FIXTURE_MONTHS(years[0]).map((month) => month.receiptCount)

    expect(counts.filter((count) => count === 1)).toHaveLength(6)
    expect(counts.filter((count) => count === 2)).toHaveLength(4)
    expect(counts.filter((count) => count >= 4)).toHaveLength(2)
  })

  it('earns more in the months that hold more receipts', () => {
    const months = FIXTURE_MONTHS(years[0])
    const busiest = months.reduce((max, month) => (month.receiptCount > max.receiptCount ? month : max))
    const quietest = months.reduce((min, month) => (month.receiptCount < min.receiptCount ? month : min))

    expect(busiest.totalToman).toBeGreaterThan(quietest.totalToman)
  })
})
