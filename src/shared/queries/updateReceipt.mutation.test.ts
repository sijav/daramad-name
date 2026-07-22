import { db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReceiptMutation, type CreateReceiptRequest } from './createReceipt.mutation'
import { updateReceiptMutation, type UpdateReceiptRequest } from './updateReceipt.mutation'

// Editing is the one time a stored toman value is allowed to change. The freeze
// protects a receipt from TIME — a later rate move must not restate history —
// not from the user correcting a typo. So an edit re-derives the total from the
// rate on the form, and must do it for the edited receipt only.

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

const editOf = (id: string, overrides: Partial<UpdateReceiptRequest> = {}): UpdateReceiptRequest => ({ id, ...request(), ...overrides })

beforeAll(async () => {
  await activateLocale('fa-IR')
})

beforeEach(() => {
  vi.stubGlobal('window', { crypto: globalThis.crypto })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('updateReceiptMutation', () => {
  it('re-freezes the toman value from the corrected rate', async () => {
    const original = await createReceiptMutation(request({ rate: 98_500 }))

    const updated = await updateReceiptMutation(editOf(original.id, { rate: 96_200 }))

    expect(updated.amountToman).toBe(48_100_000)
    expect((await db.receipts.get(original.id))?.amountToman).toBe(48_100_000)
  })

  it('touches only the receipt being edited', async () => {
    const edited = await createReceiptMutation(request())
    const untouched = await createReceiptMutation(request({ occurredAt: '2026-06-10T12:00:00.000Z', rate: 91_000 }))

    await updateReceiptMutation(editOf(edited.id, { rate: 140_000 }))

    const other = await db.receipts.get(untouched.id)
    expect(other?.rate).toBe(91_000)
    expect(other?.amountToman).toBe(untouched.amountToman)
    expect(await db.receipts.count()).toBe(2)
  })

  it('keeps the identity and the creation stamp, and moves updatedAt forward', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-10T08:00:00.000Z'))
    const original = await createReceiptMutation(request())

    vi.setSystemTime(new Date('2026-07-22T09:00:00.000Z'))
    const updated = await updateReceiptMutation(editOf(original.id, { amountOriginal: 600 }))

    expect(updated.id).toBe(original.id)
    expect(updated.createdAt).toBe('2026-05-10T08:00:00.000Z')
    expect(updated.updatedAt).toBe('2026-07-22T09:00:00.000Z')
    expect(await db.receipts.count()).toBe(1)
  })

  // Correcting a receipt to toman must drop the rate too. A stale rate left
  // beside a toman amount is a number the report cannot explain and the edit
  // form would re-offer on the next open.
  it('clears the stored rate when the currency is corrected to toman', async () => {
    const original = await createReceiptMutation(request())

    const updated = await updateReceiptMutation(editOf(original.id, { currency: 'TOMAN', amountOriginal: 18_000_000 }))

    expect(updated.rate).toBeNull()
    expect(updated.amountToman).toBe(18_000_000)
  })

  it('re-typing the same client in another case keeps the receipt on that client', async () => {
    const original = await createReceiptMutation(request({ clientName: 'Aria Trading' }))

    const updated = await updateReceiptMutation(editOf(original.id, { clientName: 'ARIA TRADING' }))

    expect(updated.clientId).toBe(original.clientId)
    expect(await db.clients.count()).toBe(1)
  })

  // The old client stays: their other receipts still point at it, and deleting
  // it here would orphan them.
  it('moves the receipt to a genuinely different client', async () => {
    const original = await createReceiptMutation(request({ clientName: 'آریا' }))

    const updated = await updateReceiptMutation(editOf(original.id, { clientName: 'نقش' }))

    expect(updated.clientId).not.toBe(original.clientId)
    expect((await db.clients.get(updated.clientId ?? ''))?.name).toBe('نقش')
    expect(await db.clients.count()).toBe(2)
  })

  it('unassigns the receipt when the client name is cleared', async () => {
    const original = await createReceiptMutation(request({ clientName: 'آریا' }))

    expect((await updateReceiptMutation(editOf(original.id, { clientName: '' }))).clientId).toBeNull()
  })

  // Two tabs, or a stale row in a list: the edit must fail loudly instead of
  // resurrecting a deleted receipt as a new one.
  it('throws when the receipt has already been deleted, and creates nothing', async () => {
    await expect(updateReceiptMutation(editOf('never-existed'))).rejects.toThrow()

    expect(await db.receipts.count()).toBe(0)
  })

  it('rejects an edit that would leave a foreign-currency receipt with no rate, and leaves the stored row intact', async () => {
    const original = await createReceiptMutation(request())

    await expect(updateReceiptMutation(editOf(original.id, { rate: null }))).rejects.toThrow()

    expect((await db.receipts.get(original.id))?.amountToman).toBe(49_250_000)
  })
})
