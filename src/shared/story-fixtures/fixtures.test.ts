import { QueryClient } from '@tanstack/react-query'
import { getIncomeReportQueryKey } from 'src/shared/queries'
import type { IncomeReport } from 'src/shared/types'
import { monthIndexOf, yearOf, yearRange } from 'src/shared/utils'
import { describe, expect, it } from 'vitest'
import { seedPageData } from './fixtures'

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
