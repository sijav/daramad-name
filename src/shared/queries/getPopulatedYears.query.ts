import type { QueryFunctionContext } from '@tanstack/react-query'
import { db } from 'src/core/db'
import type { CalendarSystem } from 'src/shared/types'
import { yearOf } from 'src/shared/utils'

export const getPopulatedYearsQueryKey = (calendar: CalendarSystem) => ['populated-years', calendar] as const

/**
 * Years that actually contain receipts, newest first, for the year picker.
 * The current year is always included so a brand-new user has something to
 * select rather than an empty dropdown.
 */
export const getPopulatedYearsQuery = async ({
  queryKey: [, calendar],
}: QueryFunctionContext<ReturnType<typeof getPopulatedYearsQueryKey>>): Promise<number[]> => {
  const receipts = await db.receipts.toArray()
  const years = new Set(receipts.map((receipt) => yearOf(new Date(receipt.occurredAt), calendar)))
  years.add(yearOf(new Date(), calendar))
  return [...years].sort((left, right) => right - left)
}
