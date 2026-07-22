import { db, defaultSettings, writeSettings } from 'src/core/db'
import type { CalendarSystem, DateRange, Receipt } from 'src/shared/types'
import { monthBucketsOfYear, yearRange } from 'src/shared/utils/dates'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getIncomeReportQuery, getIncomeReportQueryKey } from './getIncomeReport.query'

// This is the document that leaves the app. Every number here is read by
// someone with the power to refuse the applicant, and none of them can be
// checked against anything — there is no bank statement beside it. A wrong
// divisor does not look wrong; it looks like a smaller income.

const NOW = new Date('2026-07-22T09:00:00.000Z')

const call = (range: DateRange, calendar: CalendarSystem = 'JALALI') =>
  getIncomeReportQuery({ queryKey: getIncomeReportQueryKey(range, calendar) } as never)

const receipt = (id: string, occurredAt: string, amountToman: number): Receipt => ({
  id,
  occurredAt,
  amountOriginal: amountToman,
  currency: 'TOMAN',
  rate: null,
  amountToman,
  clientId: null,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const key = (month: { year: number; month: number }) => `${month.year}-${month.month}`

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the monthly average', () => {
  it('divides a completed year by twelve', async () => {
    await db.receipts.bulkAdd([receipt('a', '2025-06-10T12:00:00.000Z', 60_000_000), receipt('b', '2025-11-10T12:00:00.000Z', 60_000_000)])

    const report = await call(yearRange(1404, 'JALALI'))

    expect(report.monthsInRange).toBe(12)
    expect(report.totalToman).toBe(120_000_000)
    expect(report.monthlyAverageToman).toBe(10_000_000)
  })

  // The live bug this replaced: a year still running divided by twelve, so four
  // months of real income were reported as a third of what they were, on the
  // page an embassy uses to decide whether the applicant can support themselves.
  it('divides a year still in progress by the months actually elapsed', async () => {
    await db.receipts.bulkAdd([
      receipt('a', '2026-03-25T12:00:00.000Z', 200_000_000),
      receipt('b', '2026-07-10T12:00:00.000Z', 200_000_000),
    ])

    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.monthsInRange).toBe(4)
    expect(report.monthlyAverageToman).toBe(100_000_000)
  })

  it('reports the period as ending today, not at the far end of the requested year', async () => {
    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.range.to).toBe(NOW.toISOString())
    expect(report.range.from).toBe(yearRange(1405, 'JALALI').from)
  })

  it('leaves a range that already ended in the past exactly as asked', async () => {
    const requested = yearRange(1404, 'JALALI')

    expect((await call(requested)).range).toEqual(requested)
  })

  it('never divides by zero when the range holds no income', async () => {
    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.totalToman).toBe(0)
    expect(report.monthlyAverageToman).toBe(0)
    expect(report.monthsInRange).toBeGreaterThanOrEqual(1)
  })
})

describe('the month rows', () => {
  it('prints a row for every month of a completed year, including the ones that earned nothing', async () => {
    await db.receipts.add(receipt('a', '2025-06-10T12:00:00.000Z', 60_000_000))

    const report = await call(yearRange(1404, 'JALALI'))

    expect(report.months).toHaveLength(12)
    expect(report.months.map((month) => month.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(report.months.filter((month) => month.totalToman === 0)).toHaveLength(11)
  })

  // A certificate issued in Tir must not carry eight empty rows for months that
  // have not happened — it reads as eight months of no income.
  it('stops at the current month rather than printing the rest of the year as zeroes', async () => {
    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.months).toHaveLength(4)
    expect(report.months.at(-1)?.month).toBe(4)
  })

  // A range across Nowruz gets a bucket per (year, month) pair. Collapsing onto
  // the month number would add Esfand 1404 into Esfand 1405.
  it('keeps the two sides of a Jalali year boundary in separate rows', async () => {
    const esfand1404 = monthBucketsOfYear(1404, 'JALALI')[11]
    const ordibehesht1405 = monthBucketsOfYear(1405, 'JALALI')[1]
    await db.receipts.bulkAdd([
      receipt('esfand', '2026-03-15T12:00:00.000Z', 11_000_000),
      receipt('farvardin', '2026-03-25T12:00:00.000Z', 22_000_000),
    ])

    const report = await call({ from: esfand1404.from, to: ordibehesht1405.to })

    expect(report.months.map(key)).toEqual(['1404-12', '1405-1', '1405-2'])
    expect(report.months.find((month) => key(month) === '1404-12')?.totalToman).toBe(11_000_000)
    expect(report.months.find((month) => key(month) === '1405-1')?.totalToman).toBe(22_000_000)
    expect(report.monthsInRange).toBe(3)
  })

  it('counts the receipts in each month, not only their sum', async () => {
    await db.receipts.bulkAdd([receipt('a', '2026-03-25T12:00:00.000Z', 10_000_000), receipt('b', '2026-03-28T12:00:00.000Z', 5_000_000)])

    const farvardin = (await call(yearRange(1405, 'JALALI'))).months[0]

    expect(farvardin.receiptCount).toBe(2)
    expect(farvardin.totalToman).toBe(15_000_000)
  })

  it('buckets by the Gregorian calendar when that is the setting', async () => {
    await db.receipts.bulkAdd([
      receipt('esfand', '2026-03-15T12:00:00.000Z', 11_000_000),
      receipt('farvardin', '2026-03-25T12:00:00.000Z', 22_000_000),
    ])

    const report = await call(yearRange(2026, 'GREGORIAN'), 'GREGORIAN')

    // Both fall in March 2026, which the Jalali reading splits across two years.
    expect(report.months.map(key).slice(0, 3)).toEqual(['2026-1', '2026-2', '2026-3'])
    expect(report.months.find((month) => key(month) === '2026-3')?.totalToman).toBe(33_000_000)
    expect(report.monthsInRange).toBe(7)
  })
})

describe('what the report is built from', () => {
  // A receipt dated next month — a typo, or an invoice recorded early — must not
  // reach a certificate that claims to cover up to today.
  it('excludes income dated after today, because the period is clamped to today', async () => {
    await db.receipts.bulkAdd([
      receipt('today', '2026-07-20T12:00:00.000Z', 10_000_000),
      receipt('next-month', '2026-08-20T12:00:00.000Z', 90_000_000),
    ])

    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.totalToman).toBe(10_000_000)
  })

  it('excludes income before the range starts', async () => {
    await db.receipts.bulkAdd([
      receipt('last-year', '2026-03-15T12:00:00.000Z', 90_000_000),
      receipt('this-year', '2026-03-25T12:00:00.000Z', 10_000_000),
    ])

    expect((await call(yearRange(1405, 'JALALI'))).totalToman).toBe(10_000_000)
  })

  // There is no login, so the identity block on the certificate has exactly one
  // source. A report that lost it produces an anonymous document.
  it('carries the profile saved in settings', async () => {
    await writeSettings({ ...defaultSettings, profile: { ...defaultSettings.profile, fullName: 'رها موسوی', nationalId: '0012345678' } })

    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.profile.fullName).toBe('رها موسوی')
    expect(report.profile.nationalId).toBe('0012345678')
  })

  it('stamps the moment it was generated, so a printed copy can be dated', async () => {
    expect((await call(yearRange(1405, 'JALALI'))).generatedAt).toBe(NOW.toISOString())
  })

  it('agrees with its own rows: the month totals add up to the headline total', async () => {
    await db.receipts.bulkAdd([
      receipt('a', '2026-03-25T12:00:00.000Z', 30_000_000),
      receipt('b', '2026-04-25T12:00:00.000Z', 50_000_000),
      receipt('c', '2026-07-10T12:00:00.000Z', 10_000_000),
    ])

    const report = await call(yearRange(1405, 'JALALI'))

    expect(report.months.reduce((sum, month) => sum + month.totalToman, 0)).toBe(report.totalToman)
  })
})
