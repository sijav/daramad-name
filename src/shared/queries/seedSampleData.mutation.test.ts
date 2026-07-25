import { assertValidReceipt, db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import { monthIndexOf, startOfMonthsAgo, yearOf } from 'src/shared/utils'
import { computeToman } from 'src/shared/utils/money'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getClientSharesQuery, getClientSharesQueryKey } from './getClientShares.query'
import { seedSampleDataMutation } from './seedSampleData.mutation'

// The sample data is generated fresh on every press, so the assertions here are
// the promises that hold whatever the dice do rather than a fixed count or
// total: four years of history, a retainer past half the income, mixed
// currencies at their own frozen rates, and one empty month. If any of that
// quietly stopped being true, the screens would still render, they would just
// stop demonstrating the thing they were built to show.

const ALL_OF_TIME = { from: '2000-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' }

beforeAll(async () => {
  await activateLocale('fa-IR')
})

beforeEach(() => {
  vi.stubGlobal('window', { crypto: globalThis.crypto })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('seedSampleDataMutation', () => {
  it('writes the number of receipts it reports', async () => {
    const written = await seedSampleDataMutation()

    expect(written).toBeGreaterThan(0)
    expect(await db.receipts.count()).toBe(written)
  })

  // Sample data that could not have been entered through the form is not sample
  // data, it would let a bug through every screen that reads it.
  it('produces receipts that pass the same validation a typed one does', async () => {
    await seedSampleDataMutation()

    for (const receipt of await db.receipts.toArray()) {
      expect(() => assertValidReceipt(receipt, 'the sample data')).not.toThrow()
    }
  })

  it('freezes each foreign-currency receipt at its own rate', async () => {
    await seedSampleDataMutation()

    const foreign = (await db.receipts.toArray()).filter((receipt) => receipt.currency !== 'TOMAN')

    expect(foreign).not.toHaveLength(0)
    expect(new Set(foreign.map((receipt) => receipt.rate)).size).toBeGreaterThan(1)
    for (const receipt of foreign) {
      expect(receipt.amountToman).toBe(computeToman(receipt.amountOriginal, receipt.currency, receipt.rate))
    }
  })

  it('leaves toman receipts without a rate', async () => {
    await seedSampleDataMutation()

    const toman = (await db.receipts.toArray()).filter((receipt) => receipt.currency === 'TOMAN')

    expect(toman).not.toHaveLength(0)
    expect(toman.every((receipt) => receipt.rate === null)).toBe(true)
  })

  it('keeps one client past half the income, so the concentration warning fires', async () => {
    await seedSampleDataMutation()

    const { insight } = await getClientSharesQuery({ queryKey: getClientSharesQueryKey(ALL_OF_TIME) } as never)

    expect(insight).not.toBeNull()
    expect(insight?.percentage).toBeGreaterThan(50)
  })

  it('assigns every receipt to a client, across several of them', async () => {
    await seedSampleDataMutation()

    expect((await db.receipts.toArray()).every((receipt) => receipt.clientId !== null)).toBe(true)
    const clients = await db.clients.count()
    expect(clients).toBeGreaterThanOrEqual(4)
    expect(clients).toBeLessThanOrEqual(16)
  })

  it('spans four calendar years', async () => {
    await seedSampleDataMutation()

    const years = new Set((await db.receipts.toArray()).map((receipt) => new Date(receipt.occurredAt).getFullYear()))

    expect(years.size).toBeGreaterThanOrEqual(4)
  })

  // No month in range may be blank: a gap in the year view reads as missing
  // data, not as a quiet month. Counted in Jalali months, the calendar the seed
  // and the chart both bucket by.
  it('covers every one of the last twelve months', async () => {
    await seedSampleDataMutation()

    const now = new Date()
    const monthKey = (date: Date) => `${yearOf(date, 'JALALI')}-${monthIndexOf(date, 'JALALI')}`
    const populated = new Set((await db.receipts.toArray()).map((receipt) => monthKey(new Date(receipt.occurredAt))))
    const recentMonths = Array.from({ length: 12 }, (_unused, monthsAgo) => monthKey(startOfMonthsAgo(now, monthsAgo, 'JALALI')))

    expect(recentMonths.every((month) => populated.has(month))).toBe(true)
  })

  // The bug that sent us here: a monthly retainer counted in Gregorian months
  // shows up twice in the Jalali months a Gregorian month straddles. The busiest
  // client is the retainer, it pays once a month, so it must never land twice in
  // one Jalali month.
  it('never lists the monthly retainer twice in one Jalali month', async () => {
    await seedSampleDataMutation()
    const receipts = await db.receipts.toArray()

    const countByClient = new Map<string, number>()
    for (const receipt of receipts) {
      if (receipt.clientId) countByClient.set(receipt.clientId, (countByClient.get(receipt.clientId) ?? 0) + 1)
    }
    const retainer = [...countByClient.entries()].sort((left, right) => right[1] - left[1])[0][0]

    const perMonth = new Map<string, number>()
    for (const receipt of receipts.filter((each) => each.clientId === retainer)) {
      const date = new Date(receipt.occurredAt)
      const key = `${yearOf(date, 'JALALI')}-${monthIndexOf(date, 'JALALI')}`
      perMonth.set(key, (perMonth.get(key) ?? 0) + 1)
    }

    expect(Math.max(...perMonth.values())).toBe(1)
  })

  // Two identical rows read as one receipt entered twice, the artefact the
  // distinct-client and per-calendar-month rules exist to avoid.
  it('never repeats a receipt exactly', async () => {
    await seedSampleDataMutation()

    const keys = (await db.receipts.toArray()).map(
      (receipt) => `${receipt.clientId}|${receipt.occurredAt.slice(0, 10)}|${receipt.amountOriginal}|${receipt.currency}`,
    )

    expect(new Set(keys).size).toBe(keys.length)
  })

  // The whole point of generating it: two presses must not produce the same
  // ledger.
  it('generates different data on every run', async () => {
    const fingerprint = async () => {
      await seedSampleDataMutation()
      const amounts = (await db.receipts.toArray()).map((receipt) => receipt.amountToman).sort((left, right) => left - right)
      await db.receipts.clear()
      await db.clients.clear()
      return amounts.join(',')
    }

    expect(await fingerprint()).not.toBe(await fingerprint())
  })

  // Pressing Fill again gives a fresh sample, not two seeds stacked into the
  // same months. The UI puts a typed confirmation in front of this so someone
  // with real records cannot lose them by a stray click.
  it('replaces existing data rather than piling a second seed on top', async () => {
    await seedSampleDataMutation()
    const second = await seedSampleDataMutation()

    expect(await db.receipts.count()).toBe(second)
  })
})
