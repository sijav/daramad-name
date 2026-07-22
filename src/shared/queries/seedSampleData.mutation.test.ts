import { assertValidReceipt, db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import { computeToman } from 'src/shared/utils/money'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getClientSharesQuery, getClientSharesQueryKey } from './getClientShares.query'
import { seedSampleDataMutation } from './seedSampleData.mutation'

// The sample data is what every screenshot, story and demo is read from, so its
// shape is a promise rather than an accident: mixed currencies at different
// frozen rates, one client over half the income to trip the concentration
// warning, and one month deliberately left empty to prove a zero bar draws.
// If any of that quietly stopped being true, the screens would still render —
// they would just stop demonstrating the thing they were built to show.

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
  it('writes the receipts it says it wrote', async () => {
    expect(await seedSampleDataMutation()).toBe(13)
    expect(await db.receipts.count()).toBe(13)
  })

  // Sample data that could not have been entered through the form is not sample
  // data — it would let a bug through every screen that reads it.
  it('produces receipts that pass the same validation a typed one does', async () => {
    await seedSampleDataMutation()

    for (const receipt of await db.receipts.toArray()) {
      expect(() => assertValidReceipt(receipt, 'the sample data')).not.toThrow()
    }
  })

  it('freezes each foreign-currency receipt at its own rate', async () => {
    await seedSampleDataMutation()

    const foreign = (await db.receipts.toArray()).filter((receipt) => receipt.currency !== 'TOMAN')

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

  // The figure the design and the docs both quote. It only holds while the
  // amounts and the frozen rates are exactly what they are.
  it('adds up to the total every screenshot in the design was drawn from', async () => {
    await seedSampleDataMutation()

    const total = (await db.receipts.toArray()).reduce((sum, receipt) => sum + receipt.amountToman, 0)

    expect(total).toBe(649_980_000)
  })

  it('gives one client more than half the income, so the concentration warning has something to fire on', async () => {
    await seedSampleDataMutation()

    const { insight } = await getClientSharesQuery({ queryKey: getClientSharesQueryKey(ALL_OF_TIME) } as never)

    expect(insight).not.toBeNull()
    expect(insight?.percentage).toBeGreaterThan(50)
  })

  it('assigns every sample receipt to a client, so no slice lands in the unassigned bucket', async () => {
    await seedSampleDataMutation()

    expect((await db.receipts.toArray()).every((receipt) => receipt.clientId !== null)).toBe(true)
    expect(await db.clients.count()).toBe(4)
  })

  // The empty-month edge case: four months back is deliberately skipped, and
  // the bar chart story exists to show that month drawn as zero rather than
  // dropped from the axis.
  it('leaves exactly one of the last eleven months empty', async () => {
    await seedSampleDataMutation()

    const now = new Date()
    const monthsBack = (occurredAt: string) => {
      const date = new Date(occurredAt)
      return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
    }
    const populated = new Set((await db.receipts.toArray()).map((receipt) => monthsBack(receipt.occurredAt)))

    expect(populated.has(4)).toBe(false)
    expect([0, 1, 2, 3, 5, 6, 7, 8, 9, 10].every((month) => populated.has(month))).toBe(true)
  })

  // It is the "fill this in for me" button, not a reset button; someone with
  // real records must not lose them by pressing it.
  it('adds alongside existing data rather than clearing first', async () => {
    await seedSampleDataMutation()
    await seedSampleDataMutation()

    expect(await db.receipts.count()).toBe(26)
    // The second pass reuses the same four clients rather than duplicating them.
    expect(await db.clients.count()).toBe(4)
  })
})
