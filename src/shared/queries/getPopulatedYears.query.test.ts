import { db } from 'src/core/db'
import type { CalendarSystem, Receipt } from 'src/shared/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPopulatedYearsQuery, getPopulatedYearsQueryKey } from './getPopulatedYears.query'

// The year picker on the charts and report screens. A year missing from this
// list is a year of income the user cannot select and therefore cannot report
// silently, because the dropdown looks complete.

const NOW = new Date('2026-07-22T09:00:00.000Z')

const call = (calendar: CalendarSystem = 'JALALI') => getPopulatedYearsQuery({ queryKey: getPopulatedYearsQueryKey(calendar) } as never)

const receipt = (id: string, occurredAt: string): Receipt => ({
  id,
  occurredAt,
  amountOriginal: 1_000_000,
  currency: 'TOMAN',
  rate: null,
  amountToman: 1_000_000,
  clientId: null,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getPopulatedYearsQuery', () => {
  it('offers the current year to a brand-new user with no receipts', async () => {
    expect(await call()).toEqual([1405])
    expect(await call('GREGORIAN')).toEqual([2026])
  })

  // Receipts six days either side of Nowruz belong to different Jalali years,
  // and the picker has to offer both, the older one is where the income for
  // last year's certificate lives.
  it('finds both years across a Farvardin boundary', async () => {
    await db.receipts.bulkAdd([receipt('esfand', '2026-03-15T12:00:00.000Z'), receipt('farvardin', '2026-03-25T12:00:00.000Z')])

    expect(await call()).toEqual([1405, 1404])
  })

  it('reads the same two receipts as one Gregorian year', async () => {
    await db.receipts.bulkAdd([receipt('esfand', '2026-03-15T12:00:00.000Z'), receipt('farvardin', '2026-03-25T12:00:00.000Z')])

    expect(await call('GREGORIAN')).toEqual([2026])
  })

  it('lists every year that holds income, newest first', async () => {
    await db.receipts.bulkAdd([
      receipt('old', '2023-01-15T12:00:00.000Z'),
      receipt('mid', '2025-06-15T12:00:00.000Z'),
      receipt('new', '2026-07-10T12:00:00.000Z'),
    ])

    // Dey 1401, Khordad 1404, Tir 1405.
    expect(await call()).toEqual([1405, 1404, 1401])
  })

  it('lists a year once however many receipts it holds', async () => {
    await db.receipts.bulkAdd([receipt('a', '2026-04-01T12:00:00.000Z'), receipt('b', '2026-05-01T12:00:00.000Z')])

    expect(await call()).toEqual([1405])
  })

  it('keeps the current year even when all the income is older', async () => {
    await db.receipts.add(receipt('old', '2023-01-15T12:00:00.000Z'))

    expect(await call()).toEqual([1405, 1401])
  })
})
