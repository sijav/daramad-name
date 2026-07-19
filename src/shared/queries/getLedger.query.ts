import type { QueryFunctionContext } from '@tanstack/react-query'
import { db } from 'src/core/db'
import type { CalendarSystem, Client, Ledger, LedgerFilter, LedgerSort, Receipt, ReceiptWithClient } from 'src/shared/types'
import { monthsSpanned } from 'src/shared/utils'

export const getLedgerQueryKey = (filter: LedgerFilter, sort: LedgerSort, calendar: CalendarSystem) =>
  ['ledger', filter, sort, calendar] as const

/**
 * The ledger table, its filters and its running total.
 *
 * The summary is computed over the FILTERED rows, not the whole database —
 * scenario 2 is exactly "what did this one client pay me over these six
 * months", and a total that ignored the filter would answer a different
 * question while looking correct.
 */
export const getLedgerQuery = async ({
  queryKey: [, filter, sort, calendar],
}: QueryFunctionContext<ReturnType<typeof getLedgerQueryKey>>): Promise<Ledger> => {
  const receipts = await readFilteredReceipts(filter)
  const clients = await db.clients.toArray()
  const clientsById = new Map<string, Client>(clients.map((client) => [client.id, client]))

  const rows: ReceiptWithClient[] = receipts.map((receipt) => ({
    ...receipt,
    clientName: receipt.clientId ? (clientsById.get(receipt.clientId)?.name ?? null) : null,
  }))

  sortRows(rows, sort)

  const totalToman = rows.reduce((sum, row) => sum + row.amountToman, 0)
  const months = filter.range ? monthsSpanned(filter.range, calendar) : monthsSpannedFromRows(rows, calendar)

  return {
    receipts: rows,
    summary: {
      totalToman,
      receiptCount: rows.length,
      monthlyAverageToman: Math.round(totalToman / months),
    },
  }
}

/** Applies the date range through the indexed `occurredAt`, then the cheap equality filters. */
const readFilteredReceipts = async (filter: LedgerFilter): Promise<Receipt[]> => {
  const collection = filter.range
    ? db.receipts.where('occurredAt').between(filter.range.from, filter.range.to, true, true)
    : db.receipts.toCollection()

  const receipts = await collection.toArray()
  return receipts.filter(
    (receipt) => (!filter.clientId || receipt.clientId === filter.clientId) && (!filter.channel || receipt.channel === filter.channel),
  )
}

/** Mutates in place; the array is freshly built above so there is nothing to alias. */
const sortRows = (rows: ReceiptWithClient[], sort: LedgerSort): void => {
  const direction = sort.direction === 'asc' ? 1 : -1
  rows.sort((left, right) => {
    switch (sort.field) {
      case 'amountToman':
        return (left.amountToman - right.amountToman) * direction
      case 'client':
        return (left.clientName ?? '').localeCompare(right.clientName ?? '', 'fa') * direction
      case 'channel':
        return left.channel.localeCompare(right.channel) * direction
      case 'occurredAt':
      default:
        return left.occurredAt.localeCompare(right.occurredAt) * direction
    }
  })
}

/** With no range filter, the average spans from the first receipt to the last. */
const monthsSpannedFromRows = (rows: ReceiptWithClient[], calendar: CalendarSystem): number => {
  if (rows.length === 0) {
    return 1
  }
  const dates = rows.map((row) => row.occurredAt).sort()
  return monthsSpanned({ from: dates[0], to: dates[dates.length - 1] }, calendar)
}
