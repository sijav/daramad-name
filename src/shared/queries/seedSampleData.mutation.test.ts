import { assertValidReceipt, db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
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

  // The empty-month edge case: one recent month has nothing, and the bar chart
  // story exists to show it drawn as zero rather than dropped from the axis.
  it('leaves at least one of the last twelve months empty', async () => {
    await seedSampleDataMutation()

    const now = new Date()
    const monthsBack = (occurredAt: string) => {
      const date = new Date(occurredAt)
      return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
    }
    const recent = new Set(
      (await db.receipts.toArray()).map((receipt) => monthsBack(receipt.occurredAt)).filter((month) => month >= 0 && month < 12),
    )

    expect(recent.size).toBeLessThan(12)
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

  // It is the "fill this in for me" button, not a reset button; someone with
  // real records must not lose them by pressing it.
  it('adds alongside existing data rather than clearing first', async () => {
    const first = await seedSampleDataMutation()
    const second = await seedSampleDataMutation()

    expect(await db.receipts.count()).toBe(first + second)
  })
})
