import type { QueryFunctionContext } from '@tanstack/react-query'
import { db } from 'src/core/db'
import type { CalendarSystem, Client, DateRange, Ledger, LedgerFilter, LedgerSort, Receipt, ReceiptWithClient } from 'src/shared/types'
import { averagingPeriod } from 'src/shared/utils'

export const getLedgerQueryKey = (filter: LedgerFilter, sort: LedgerSort, calendar: CalendarSystem) =>
  ['ledger', filter, sort, calendar] as const

/**
 * The ledger table, its filters and its running total.
 *
 * The summary is computed over the FILTERED rows, not the whole database
 * scenario 2 is exactly "what did this one client pay me over these six
 * months", and a total that ignored the filter would answer a different
 * question while looking correct.
 */
export const getLedgerQuery = async ({
  queryKey: [, filter, sort, calendar],
}: QueryFunctionContext<ReturnType<typeof getLedgerQueryKey>>): Promise<Ledger> => {
  // Read the rows over the SAME period the average divides by. Reading the raw
  // range while dividing by the clamped one counted future-dated receipts in
  // the total but gave them no months, so a range ending in the future, which
  // is what "this year" means for eleven months of every year, inflated the
  // ledger's average against the report's. The report has always clamped both.
  const period = averagingPeriod(filter.range ?? (await unfilteredPeriod()), calendar)

  const receipts = await readFilteredReceipts({ ...filter, range: period.range })
  const clients = await db.clients.toArray()
  const clientsById = new Map<string, Client>(clients.map((client) => [client.id, client]))

  const rows: ReceiptWithClient[] = receipts.map((receipt) => ({
    ...receipt,
    clientName: receipt.clientId ? (clientsById.get(receipt.clientId)?.name ?? null) : null,
  }))

  sortRows(rows, sort)

  const totalToman = rows.reduce((sum, row) => sum + row.amountToman, 0)
  const months = period.months

  return {
    receipts: rows,
    summary: {
      totalToman,
      receiptCount: rows.length,
      monthlyAverageToman: Math.round(totalToman / months),
      monthsInRange: months,
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
      // Sorting the ORIGINAL amount compares across currencies, so group by
      // currency first, otherwise 100 USD interleaves with 100 Toman and the
      // column reads as unsorted.
      case 'amountOriginal':
        return (left.currency.localeCompare(right.currency) || left.amountOriginal - right.amountOriginal) * direction
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

/**
 * With no filter the period runs from the first receipt to TODAY, not to the
 * last receipt.
 *
 * Ending at the last receipt drops every quiet month since, which is precisely
 * the "months with income" divisor the rule forbids: income clustered in three
 * months of a year divided by three, printing an average four times the one the
 * report showed for the same data. Months you earned nothing are still months.
 */
const unfilteredPeriod = async (): Promise<DateRange> => {
  const now = new Date().toISOString()
  // Read the earliest date from the index rather than from the rows, because
  // the rows are now read against this period, deriving it from them would be
  // circular.
  const first = await db.receipts.orderBy('occurredAt').first()
  return { from: first?.occurredAt ?? now, to: now }
}
