import type { QueryFunctionContext } from '@tanstack/react-query'
import { db } from 'src/core/db'
import type { CalendarSystem, MonthlyTotal } from 'src/shared/types'
import { monthBucketsOfYear } from 'src/shared/utils'

export const getMonthlyTotalsQueryKey = (year: number, calendar: CalendarSystem) => ['monthly-totals', year, calendar] as const

/**
 * Twelve buckets for the bar chart, always all twelve.
 *
 * A month with no income is returned with `totalToman: 0` rather than omitted —
 * the brief's edge case. Dropping empty months would silently redraw the axis
 * and make a bad month look like it never happened.
 */
export const getMonthlyTotalsQuery = async ({
  queryKey: [, year, calendar],
}: QueryFunctionContext<ReturnType<typeof getMonthlyTotalsQueryKey>>): Promise<MonthlyTotal[]> => {
  const buckets = monthBucketsOfYear(year, calendar)

  return Promise.all(
    buckets.map(async (bucket, index) => {
      const receipts = await db.receipts.where('occurredAt').between(bucket.from, bucket.to, true, true).toArray()
      return {
        month: index + 1,
        year,
        totalToman: receipts.reduce((sum, receipt) => sum + receipt.amountToman, 0),
        receiptCount: receipts.length,
      }
    }),
  )
}
