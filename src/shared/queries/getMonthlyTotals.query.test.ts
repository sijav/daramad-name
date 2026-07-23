import { db } from 'src/core/db'
import type { CalendarSystem, Receipt } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { getMonthlyTotalsQuery, getMonthlyTotalsQueryKey } from './getMonthlyTotals.query'

// The bar chart. Two things can go wrong here and neither announces itself: a
// month with no income can be dropped instead of drawn as zero, which redraws
// the axis and makes a bad month look like it never happened, and a Jalali
// year can quietly start in January, which moves everything by three months and
// mixes two years' income into one chart.

const call = (year: number, calendar: CalendarSystem = 'JALALI') =>
  getMonthlyTotalsQuery({ queryKey: getMonthlyTotalsQueryKey(year, calendar) } as never)

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

// 1405 begins at Farvardin 1, which is 21 March 2026. These two instants sit
// six days either side of it, far enough that no timezone can move them across.
const ESFAND_1404 = '2026-03-15T12:00:00.000Z'
const FARVARDIN_1405 = '2026-03-25T12:00:00.000Z'
const ESFAND_1405 = '2027-03-10T12:00:00.000Z'

describe('getMonthlyTotalsQuery', () => {
  it('returns twelve months even for a year with no receipts at all', async () => {
    const months = await call(1405)

    expect(months).toHaveLength(12)
    expect(months.map((month) => month.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(months.every((month) => month.totalToman === 0 && month.receiptCount === 0)).toBe(true)
  })

  it('keeps the quiet months in place with a zero, rather than dropping them', async () => {
    await db.receipts.bulkAdd([receipt('a', FARVARDIN_1405, 30_000_000), receipt('b', ESFAND_1405, 20_000_000)])

    const months = await call(1405)

    expect(months).toHaveLength(12)
    expect(months[0].totalToman).toBe(30_000_000)
    expect(months[11].totalToman).toBe(20_000_000)
    expect(months.slice(1, 11).every((month) => month.totalToman === 0)).toBe(true)
  })

  // The Farvardin boundary. A receipt six days before Nowruz belongs to the
  // previous year; counting it in Farvardin would inflate the first bar of
  // every chart and take the income out of the year it was earned in.
  it('does not pull Esfand of the previous year into Farvardin', async () => {
    await db.receipts.bulkAdd([receipt('esfand', ESFAND_1404, 90_000_000), receipt('farvardin', FARVARDIN_1405, 10_000_000)])

    const months = await call(1405)

    expect(months[0].totalToman).toBe(10_000_000)
    expect(months.reduce((sum, month) => sum + month.totalToman, 0)).toBe(10_000_000)
  })

  it('finds that same Esfand receipt in the previous year, in the last bucket', async () => {
    await db.receipts.add(receipt('esfand', ESFAND_1404, 90_000_000))

    const months = await call(1404)

    expect(months[11].totalToman).toBe(90_000_000)
    expect(months[11].receiptCount).toBe(1)
  })

  it('adds up several receipts in the same month and counts them', async () => {
    await db.receipts.bulkAdd([
      receipt('a', FARVARDIN_1405, 10_000_000),
      receipt('b', '2026-03-28T12:00:00.000Z', 5_000_000),
      receipt('c', '2026-05-05T12:00:00.000Z', 1_000_000),
    ])

    const months = await call(1405)

    expect(months[0]).toMatchObject({ month: 1, year: 1405, totalToman: 15_000_000, receiptCount: 2 })
    expect(months[1].receiptCount).toBe(1)
  })

  it('tags every bucket with the year that was asked for', async () => {
    expect((await call(1403)).every((month) => month.year === 1403)).toBe(true)
  })

  // Switching the calendar setting has to move the buckets, not just relabel
  // them. Both receipts fall in March 2026, which the Jalali reading splits
  // across two different years.
  it('puts both sides of Nowruz in the same March when the calendar is Gregorian', async () => {
    await db.receipts.bulkAdd([receipt('esfand', ESFAND_1404, 90_000_000), receipt('farvardin', FARVARDIN_1405, 10_000_000)])

    const months = await call(2026, 'GREGORIAN')

    expect(months).toHaveLength(12)
    expect(months[2]).toMatchObject({ month: 3, totalToman: 100_000_000, receiptCount: 2 })
    expect(months[0].totalToman).toBe(0)
  })
})
