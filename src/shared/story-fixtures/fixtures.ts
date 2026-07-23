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
import type { CalendarSystem, ClientShare, Ledger, MonthlyTotal, Profile, ReceiptWithClient } from 'src/shared/types'
import { averagingPeriod, monthIndexOf, yearOf, yearRange } from 'src/shared/utils'

// Fixture data and cache seeding for PAGE stories.
//
// Pages read through TanStack Query, so stories pre-populate the cache with the
// exact keys the pages build. The story client sets `staleTime: Infinity`, so
// nothing seeded here is refetched and a page renders with no database at all.

const CALENDAR: CalendarSystem = 'JALALI'

/** The demo identity, in one place: the certificate prints it and `preview.tsx` seeds it into Settings. */
export const FIXTURE_PROFILE: Profile = {
  fullName: 'رها موسوی',
  fullNameEn: 'Raha Mousavi',
  nationalId: '۰۰۱۲۳۴۵۶۷۸',
  passportNumber: 'A98765432',
  phone: '',
  address: 'تهران، خیابان کریم‌خان',
  addressEn: 'Karimkhan St, Tehran',
}

/** The same identity minus the fields only the certificate needs. Settings stories type those in themselves. */
export const FIXTURE_SETTINGS_PROFILE: Profile = {
  ...FIXTURE_PROFILE,
  nationalId: '',
  passportNumber: '',
  address: '',
  addressEn: '',
}

const iso = (monthsAgo: number, day: number): string => {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo, day)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

// The client name doubles as the client id throughout the fixture, so a stored
// receipt already carries the id `FIXTURE_CLIENTS` is keyed on.
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

/** The receipts above run from this month back to six months ago, so the ledger summary divides by seven. */
const MONTHS_COVERED = 7

const total = FIXTURE_RECEIPTS.reduce((sum, r) => sum + r.amountToman, 0)

export const FIXTURE_LEDGER: Ledger = {
  receipts: FIXTURE_RECEIPTS,
  summary: {
    totalToman: total,
    receiptCount: FIXTURE_RECEIPTS.length,
    monthlyAverageToman: Math.round(total / MONTHS_COVERED),
    monthsInRange: MONTHS_COVERED,
  },
}

const receiptsFor = (name: string): ReceiptWithClient[] => FIXTURE_RECEIPTS.filter((r) => r.clientName === name)

export const FIXTURE_SHARES: ClientShare[] = ['Aria Trading', 'Dadepardaz Co.', 'Naghsh Studio', 'Homa Cafe']
  .map((name) => {
    const totalToman = receiptsFor(name).reduce((sum, r) => sum + r.amountToman, 0)
    return { clientId: name, clientName: name, totalToman, percentage: Math.round((totalToman / total) * 1000) / 10 }
  })
  .sort((a, b) => b.totalToman - a.totalToman)

export const FIXTURE_CLIENTS = FIXTURE_SHARES.map((s) => ({
  id: s.clientId,
  name: s.clientName,
  nameKey: s.clientName.toLowerCase(),
  createdAt: iso(12, 1),
  totalToman: s.totalToman,
  receiptCount: receiptsFor(s.clientName).length,
}))

// How precisely an amount is quoted follows a power law: a round million is
// ordinary, a half million happens, a hundred thousand is unusual, an exact ten
// thousand is rare. Nothing finer, nobody is paid ۲۲٬۳۴۷٬۸۹۱.
const COMMON = 1_000_000
const UNCOMMON = 500_000
const RARE = 100_000
const LEGENDARY = 10_000

// Twelve buckets of income and receipt count, moving together so the
// certificate's «تعداد دریافتی» column agrees with the amounts beside it. Each
// month carries its own step so the year scaling rounds back onto that step
// rather than onto arbitrary digits.
const MONTH_SHAPE: readonly (readonly [toman: number, receipts: number, step: number])[] = [
  [22_000_000, 1, COMMON],
  [58_500_000, 2, UNCOMMON],
  [31_000_000, 1, COMMON],
  [112_000_000, 4, COMMON],
  [41_000_000, 1, COMMON],
  [64_300_000, 2, RARE],
  [19_500_000, 1, UNCOMMON],
  [147_000_000, 5, COMMON],
  [27_000_000, 1, COMMON],
  [70_000_000, 2, COMMON],
  [35_240_000, 1, LEGENDARY],
  [55_000_000, 2, COMMON],
]

const roundToStep = (value: number, step: number): number => Math.round(value / step) * step

// Earlier years read lighter, so moving the year picker visibly changes the
// page instead of repeating one set of twelve numbers four times over.
const YEAR_SCALE = [1, 0.82, 0.65, 0.5]

export const FIXTURE_MONTHS = (year: number): MonthlyTotal[] => {
  const yearsBack = Math.max(0, yearOf(new Date(), CALENDAR) - year)
  const scale = YEAR_SCALE[Math.min(yearsBack, YEAR_SCALE.length - 1)]
  return MONTH_SHAPE.map(([toman, receipts, step], index) => ({
    month: index + 1,
    year,
    totalToman: roundToStep(toman * scale, step),
    receiptCount: receipts,
  }))
}

/** The year given and one for each earlier `YEAR_SCALE` step, newest first. */
export const FIXTURE_YEARS = (year: number): number[] => YEAR_SCALE.map((_, index) => year - index)

/**
 * Seeds every key the pages query. `empty: true` seeds the same keys with no
 * data, which is how the empty-state stories are produced without a second set
 * of fixtures.
 */
export const seedPageData = (client: QueryClient, { empty = false }: { empty?: boolean } = {}): void => {
  const year = yearOf(new Date(), CALENDAR)
  const range = yearRange(year, CALENDAR)
  const monthsOf = (of: number): MonthlyTotal[] =>
    FIXTURE_MONTHS(of).map((month) => (empty ? { ...month, totalToman: 0, receiptCount: 0 } : month))

  const ledger: Ledger = empty
    ? { receipts: [], summary: { totalToman: 0, receiptCount: 0, monthlyAverageToman: 0, monthsInRange: 1 } }
    : FIXTURE_LEDGER
  const shares = empty ? [] : FIXTURE_SHARES

  client.setQueryData(clientsQueryKey, empty ? [] : FIXTURE_CLIENTS)

  // Every year is seeded, not just the current one; selecting an earlier year
  // in the picker otherwise landed on an empty page.
  const years = FIXTURE_YEARS(year)
  client.setQueryData(getPopulatedYearsQueryKey(CALENDAR), years)
  for (const populated of years) {
    client.setQueryData(getMonthlyTotalsQueryKey(populated, CALENDAR), monthsOf(populated))
  }

  client.setQueryData(getClientSharesQueryKey(range), {
    shares,
    insight: shares.length === 0 ? null : { clientName: shares[0].clientName, percentage: shares[0].percentage },
  })

  // The ledger page and the dashboard build different keys for the same data.
  client.setQueryData(getLedgerQueryKey({}, { field: 'occurredAt', direction: 'desc' }, CALENDAR), ledger)
  client.setQueryData(getLedgerQueryKey({ range }, { field: 'occurredAt', direction: 'desc' }, CALENDAR), ledger)

  // `getIncomeReportQuery` buckets only the months inside the clamped range, so
  // it can never print a month past today. The seeded months are cut the same
  // way and the total is their sum, otherwise the certificate lists months that
  // have not happened, sums them, then divides by the months elapsed.
  const { range: reported, months: monthsInRange } = averagingPeriod(range, CALENDAR)
  const elapsed = monthIndexOf(new Date(), CALENDAR) + 1
  const reportedMonths = monthsOf(year).filter((month) => month.month <= elapsed)
  const reportedTotal = reportedMonths.reduce((sum, month) => sum + month.totalToman, 0)

  client.setQueryData(getIncomeReportQueryKey(range, CALENDAR), {
    profile: FIXTURE_PROFILE,
    range: reported,
    totalToman: reportedTotal,
    monthlyAverageToman: Math.round(reportedTotal / monthsInRange),
    monthsInRange,
    months: reportedMonths,
    generatedAt: new Date().toISOString(),
  })
}

const clear = async () => {
  await Promise.all([db.receipts.clear(), db.clients.clear()])
}

const write = async () => {
  await clear()
  await db.clients.bulkPut(FIXTURE_CLIENTS.map(({ totalToman: _totalToman, receiptCount: _receiptCount, ...client }) => client))
  await db.receipts.bulkPut(FIXTURE_RECEIPTS.map(({ clientName: _clientName, ...stored }) => stored))
}

// One in-flight write, shared by every concurrent caller.
let seeded: Promise<void> | undefined
let holders = 0

/**
 * Writes the fixtures into the REAL database and returns a cleanup that empties
 * the tables again.
 *
 * Seeding the query cache is enough for a story that only renders, but not for
 * one that filters: a changed filter is a changed query key, the cache misses,
 * and the query falls through to Dexie. The Storybook browser project runs real
 * Chromium with real IndexedDB, so scenario tests seed it and exercise the
 * actual query.
 *
 * A Docs page renders EVERY story of its component at once, so several call
 * this at the same moment. Run separately their clears and writes interleave
 * and Dexie rejects the batch: «receipts.bulkAdd(): 8 of 8 operations failed.
 * ConstraintError». Hence one shared write, `bulkPut` so a re-seed is
 * idempotent, and a clear only once the last holder releases.
 */
export const seedDatabase = async (): Promise<() => Promise<void>> => {
  holders += 1
  seeded ??= write()
  await seeded

  let released = false
  return async () => {
    // A story that unmounts twice must not empty the tables out from under the
    // stories still on screen.
    if (released) return
    released = true
    holders -= 1
    if (holders > 0) return
    seeded = undefined
    await clear()
  }
}
