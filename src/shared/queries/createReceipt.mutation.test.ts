import { db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReceiptMutation, type CreateReceiptRequest } from './createReceipt.mutation'

// Scenario 1, and the promise the whole product rests on: the toman value is
// computed once, here, and stored. If it were ever recomputed on read, every
// past receipt would silently restate itself the next time Tether moved, and
// the certificate an embassy reads would describe income the freelancer never
// received.

const request = (overrides: Partial<CreateReceiptRequest> = {}): CreateReceiptRequest => ({
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: 500,
  currency: 'USDT',
  rate: 98_500,
  clientName: 'آریا',
  channel: 'TETHER',
  note: '',
  ...overrides,
})

// The mutation throws localized errors and mints ids through `window.crypto`.
beforeAll(async () => {
  await activateLocale('fa-IR')
})

beforeEach(() => {
  vi.stubGlobal('window', { crypto: globalThis.crypto })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the frozen rate', () => {
  it('stores the toman value derived from the rate on the form', async () => {
    const receipt = await createReceiptMutation(request())

    expect(receipt.amountToman).toBe(49_250_000)
    expect((await db.receipts.get(receipt.id))?.amountToman).toBe(49_250_000)
  })

  // The regression that matters: writing today's receipt at a new rate must not
  // reach back and restate May's.
  it('leaves an earlier receipt untouched when a later one is written at a different rate', async () => {
    const may = await createReceiptMutation(request({ rate: 98_500 }))
    await createReceiptMutation(request({ occurredAt: '2026-07-10T12:00:00.000Z', rate: 140_000 }))

    const stored = await db.receipts.get(may.id)

    expect(stored?.rate).toBe(98_500)
    expect(stored?.amountToman).toBe(49_250_000)
  })

  it('ignores a rate typed against a toman receipt instead of multiplying by it', async () => {
    const receipt = await createReceiptMutation(request({ currency: 'TOMAN', amountOriginal: 18_000_000, rate: 98_500 }))

    expect(receipt.rate).toBeNull()
    expect(receipt.amountToman).toBe(18_000_000)
  })

  it('rounds to whole toman, because toman has no sub-unit', async () => {
    const receipt = await createReceiptMutation(request({ currency: 'USD', amountOriginal: 0.5, rate: 98_501 }))

    expect(receipt.amountToman).toBe(49_251)
  })

  // `computeToman` returns 0 when the rate is missing, so without the guard the
  // receipt would land in the ledger contributing nothing to any total while
  // still showing «۵۰۰ دلار» in its own row.
  it('refuses a foreign-currency receipt with no rate, and writes nothing', async () => {
    await expect(createReceiptMutation(request({ rate: null }))).rejects.toThrow()

    expect(await db.receipts.count()).toBe(0)
  })
})

describe('what gets stored', () => {
  it('keeps the date the money arrived, not the date it was entered', async () => {
    const receipt = await createReceiptMutation(request({ occurredAt: '2026-01-04T09:30:00.000Z' }))

    expect(receipt.occurredAt).toBe('2026-01-04T09:30:00.000Z')
    expect(receipt.createdAt).not.toBe('2026-01-04T09:30:00.000Z')
  })

  it('stamps createdAt and updatedAt with the same instant on a fresh receipt', async () => {
    const receipt = await createReceiptMutation(request())

    expect(receipt.updatedAt).toBe(receipt.createdAt)
  })

  it('stores an untyped note as null rather than an empty string', async () => {
    expect((await createReceiptMutation(request({ note: '   ' }))).note).toBeNull()
    expect((await createReceiptMutation(request({ note: '  قسط اول  ' }))).note).toBe('قسط اول')
  })
})

describe('the client the name resolves to', () => {
  it('reuses the same client for a name typed with different padding', async () => {
    const first = await createReceiptMutation(request({ clientName: 'آریا' }))
    const second = await createReceiptMutation(request({ clientName: ' آریا ' }))

    expect(second.clientId).toBe(first.clientId)
    expect(await db.clients.count()).toBe(1)
  })

  it('reuses the same client for a name typed in different case', async () => {
    const first = await createReceiptMutation(request({ clientName: 'Aria Trading' }))
    const second = await createReceiptMutation(request({ clientName: 'aria trading' }))

    expect(second.clientId).toBe(first.clientId)
    expect(await db.clients.count()).toBe(1)
  })

  it('leaves the receipt unassigned when no name was typed', async () => {
    const receipt = await createReceiptMutation(request({ clientName: '   ' }))

    expect(receipt.clientId).toBeNull()
    expect(await db.clients.count()).toBe(0)
  })
})
