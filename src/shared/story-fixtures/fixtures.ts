import type { QueryClient } from '@tanstack/react-query'
import { db } from 'src/core/db'
import {
  clientsQueryKey,
  getClientSharesQueryKey,
  getIncomeReportQueryKey,
  getLedgerQueryKey,
  getMonthlyTotalsQueryKey,
  getPopulatedYearsQueryKey,
} from 'src/shared/queries'
import type { CalendarSystem, ClientShare, Ledger, MonthlyTotal, ReceiptWithClient } from 'src/shared/types'
import { averagingPeriod, monthIndexOf, yearOf, yearRange } from 'src/shared/utils'

// Fixture data and cache seeding for PAGE stories.
//
// Pages read everything through TanStack Query, which reads IndexedDB. Rather
// than mocking Dexie, stories pre-populate the query cache with the exact keys
// the pages build. Combined with `staleTime: Infinity` on the story client, the
// seeded values are never refetched, so a page renders deterministically with
// no database at all.

const CALENDAR: CalendarSystem = 'JALALI'

const iso = (monthsAgo: number, day: number): string => {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo, day)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

const receipt = (
  id: string,
  monthsAgo: number,
  day: number,
  clientName: string,
  channel: ReceiptWithClient['channel'],
  currency: ReceiptWithClient['currency'],
  amountOriginal: number,
  rate: number | null,
  note: string | null,
): ReceiptWithClient => ({
  id,
  occurredAt: iso(monthsAgo, day),
  amountOriginal,
  currency,
  rate,
  amountToman: rate ? Math.round(amountOriginal * rate) : amountOriginal,
  clientId: clientName,
  clientName,
  channel,
  note,
  createdAt: iso(monthsAgo, day),
  updatedAt: iso(monthsAgo, day),
})

export const FIXTURE_RECEIPTS: ReceiptWithClient[] = [
  receipt('1', 0, 8, 'Aria Trading', 'TETHER', 'USDT', 500, 98500, 'Deposit for design phase one'),
  receipt('2', 0, 21, 'Naghsh Studio', 'CARD_TO_CARD', 'TOMAN', 18000000, null, 'App icon set'),
  receipt('3', 1, 4, 'Aria Trading', 'REMITTANCE', 'USD', 1200, 96200, 'Phase two settlement'),
  receipt('4', 1, 19, 'Homa Cafe', 'CARD_TO_CARD', 'TOMAN', 9500000, null, 'Menu design'),
  receipt('5', 2, 12, 'Aria Trading', 'TETHER', 'USDT', 750, 94800, 'Product page redesign'),
  receipt('6', 3, 2, 'Dadepardaz Co.', 'REMITTANCE', 'TOMAN', 22000000, null, 'Analytics dashboard'),
  receipt('7', 5, 15, 'Aria Trading', 'REMITTANCE', 'USD', 1800, 89500, 'Three-month contract'),
  receipt('8', 6, 9, 'Homa Cafe', 'CARD_TO_CARD', 'TOMAN', 12000000, null, 'Banner and social posts'),
]

const total = FIXTURE_RECEIPTS.reduce((sum, r) => sum + r.amountToman, 0)

export const FIXTURE_LEDGER: Ledger = {
  receipts: FIXTURE_RECEIPTS,
  summary: { totalToman: total, receiptCount: FIXTURE_RECEIPTS.length, monthlyAverageToman: Math.round(total / 7), monthsInRange: 7 },
}

const byClient = (name: string): number => FIXTURE_RECEIPTS.filter((r) => r.clientName === name).reduce((sum, r) => sum + r.amountToman, 0)

export const FIXTURE_SHARES: ClientShare[] = ['Aria Trading', 'Dadepardaz Co.', 'Naghsh Studio', 'Homa Cafe']
  .map((name) => ({
    clientId: name,
    clientName: name,
    totalToman: byClient(name),
    percentage: Math.round((byClient(name) / total) * 1000) / 10,
  }))
  .sort((a, b) => b.totalToman - a.totalToman)

/** Twelve buckets with a couple of empty months, to exercise the zero-bar case. */
export const FIXTURE_MONTHS = (year: number): MonthlyTotal[] => {
  const values = [22, 108, 125, 67, 0, 0, 33, 15, 0, 52, 70, 0]
  return values.map((m, index) => ({
    month: index + 1,
    year,
    totalToman: m * 1_000_000,
    receiptCount: m > 0 ? 1 : 0,
  }))
}

export const FIXTURE_CLIENTS = FIXTURE_SHARES.map((s) => ({
  id: s.clientId,
  name: s.clientName,
  nameKey: s.clientName.toLowerCase(),
  createdAt: new Date().toISOString(),
  totalToman: s.totalToman,
  receiptCount: FIXTURE_RECEIPTS.filter((r) => r.clientName === s.clientName).length,
}))

/**
 * Seeds every key the pages query. `empty: true` seeds the same keys with no
 * data, which is how the empty-state stories are produced without a second set
 * of fixtures.
 */
export const seedPageData = (client: QueryClient, { empty = false }: { empty?: boolean } = {}): void => {
  const year = yearOf(new Date(), CALENDAR)
  const range = yearRange(year, CALENDAR)

  const ledger: Ledger = empty
    ? { receipts: [], summary: { totalToman: 0, receiptCount: 0, monthlyAverageToman: 0, monthsInRange: 1 } }
    : FIXTURE_LEDGER
  const shares = empty ? [] : FIXTURE_SHARES
  const months = empty ? FIXTURE_MONTHS(year).map((m) => ({ ...m, totalToman: 0, receiptCount: 0 })) : FIXTURE_MONTHS(year)

  client.setQueryData(clientsQueryKey, empty ? [] : FIXTURE_CLIENTS)
  client.setQueryData(getPopulatedYearsQueryKey(CALENDAR), [year, year - 1])
  client.setQueryData(getMonthlyTotalsQueryKey(year, CALENDAR), months)
  client.setQueryData(getClientSharesQueryKey(range), {
    shares,
    insight: empty || shares.length === 0 ? null : { clientName: shares[0].clientName, percentage: shares[0].percentage },
  })

  // The ledger page and the dashboard build different keys for the same data.
  client.setQueryData(getLedgerQueryKey({}, { field: 'occurredAt', direction: 'desc' }, CALENDAR), ledger)
  client.setQueryData(getLedgerQueryKey({ range }, { field: 'occurredAt', direction: 'desc' }, CALENDAR), ledger)

  // The report covers the period ELAPSED so far, exactly as the real query does.
  //
  // `getIncomeReportQuery` reads receipts BETWEEN the clamped range and buckets
  // only those, so it can never print a month past today. Seeding the raw year
  // instead produced a certificate that contradicted itself: twelve month rows,
  // four of them carrying income from months that have not happened, all summed
  // into a total — and then divided by the five months elapsed. That inflates
  // the average and is indefensible on a page an embassy reads.
  //
  // So the months are cut to the period the same way, and the total is their
  // sum. Rows, total and divisor then agree and the arithmetic can be checked
  // by hand, which is the whole point of printing the basis.
  const { range: reported, months: monthsInRange } = averagingPeriod(range, CALENDAR)
  const elapsed = monthIndexOf(new Date(), CALENDAR) + 1
  const reportedMonths = months.filter((month) => month.month <= elapsed)
  const reportedTotal = reportedMonths.reduce((sum, month) => sum + month.totalToman, 0)

  client.setQueryData(getIncomeReportQueryKey(range, CALENDAR), {
    profile: {
      fullName: 'رها موسوی',
      fullNameEn: 'Raha Mousavi',
      nationalId: '۰۰۱۲۳۴۵۶۷۸',
      passportNumber: 'A98765432',
      phone: '',
      address: 'تهران، خیابان کریم‌خان',
      addressEn: 'Karimkhan St, Tehran',
    },
    range: reported,
    totalToman: reportedTotal,
    monthlyAverageToman: empty ? 0 : Math.round(reportedTotal / monthsInRange),
    monthsInRange,
    months: reportedMonths,
    generatedAt: new Date().toISOString(),
  })
}

/**
 * Writes the fixtures into the REAL database.
 *
 * Seeding the query cache is enough for a story that only renders, but not for
 * one that filters: changing a filter changes the query key, the cache misses,
 * and the query falls through to Dexie — which is empty, so the table would go
 * blank mid-test and prove nothing. The Storybook browser project runs in real
 * Chromium with real IndexedDB, so scenario tests seed it properly and exercise
 * the actual query.
 *
 * Returns a cleanup that empties the tables again, so one scenario cannot leak
 * rows into the next.
 */
export const seedDatabase = async (): Promise<() => Promise<void>> => {
  const clear = async () => {
    await Promise.all([db.receipts.clear(), db.clients.clear()])
  }
  await clear()

  await db.clients.bulkAdd(FIXTURE_CLIENTS.map(({ id, name }) => ({ id, name, nameKey: name.toLowerCase(), createdAt: iso(12, 1) })))
  await db.receipts.bulkAdd(
    FIXTURE_RECEIPTS.map(({ clientName: _clientName, ...receipt }) => ({
      ...receipt,
      clientId: FIXTURE_CLIENTS.find((client) => client.name === _clientName)?.id ?? null,
    })),
  )

  return clear
}
