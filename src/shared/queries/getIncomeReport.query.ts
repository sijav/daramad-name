import type { QueryFunctionContext } from '@tanstack/react-query'
import { db, readSettings } from 'src/core/db'
import type { CalendarSystem, DateRange, IncomeReport, MonthlyTotal } from 'src/shared/types'
import { averagingPeriod, monthBucketsOfYear, monthIndexOf, yearOf } from 'src/shared/utils'

export const getIncomeReportQueryKey = (range: DateRange, calendar: CalendarSystem) => ['income-report', range, calendar] as const

/**
 * Everything the PDF prints. Computed, never stored.
 *
 * The monthly average divides by months ELAPSED in the range, not by months
 * that had income. An embassy reads this as "what does this person earn per
 * month"; dividing by only the productive months would inflate it and
 * misrepresent the applicant.
 */
export const getIncomeReportQuery = async ({
  queryKey: [, requestedRange, calendar],
}: QueryFunctionContext<ReturnType<typeof getIncomeReportQueryKey>>): Promise<IncomeReport> => {
  // The period never runs past today. A certificate for the current year would
  // otherwise claim to cover months that have not happened, printing eight
  // zero rows for the future and dividing four months of real income by 12,
  // which understates the holder threefold on the page an embassy reads.
  const { range, months: monthsInRange } = averagingPeriod(requestedRange, calendar)

  const [receipts, settings] = await Promise.all([
    db.receipts.where('occurredAt').between(range.from, range.to, true, true).toArray(),
    readSettings(),
  ])

  const totalToman = receipts.reduce((sum, receipt) => sum + receipt.amountToman, 0)

  // Bucket by month within the range. Ranges that span a year boundary get a
  // bucket per (year, month) pair rather than collapsing onto month number.
  const buckets = new Map<string, MonthlyTotal>()
  const fromYear = yearOf(new Date(range.from), calendar)
  const toYear = yearOf(new Date(range.to), calendar)
  for (let year = fromYear; year <= toYear; year += 1) {
    monthBucketsOfYear(year, calendar).forEach((bucket, index) => {
      if (bucket.to < range.from || bucket.from > range.to) {
        return
      }
      buckets.set(`${year}-${index + 1}`, { month: index + 1, year, totalToman: 0, receiptCount: 0 })
    })
  }

  for (const receipt of receipts) {
    const date = new Date(receipt.occurredAt)
    const key = `${yearOf(date, calendar)}-${monthIndexOf(date, calendar) + 1}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.totalToman += receipt.amountToman
      bucket.receiptCount += 1
    }
  }

  const months = [...buckets.values()].sort((left, right) => left.year - right.year || left.month - right.month)

  return {
    profile: settings.profile,
    range,
    totalToman,
    monthlyAverageToman: Math.round(totalToman / monthsInRange),
    monthsInRange,
    months,
    generatedAt: new Date().toISOString(),
  }
}
