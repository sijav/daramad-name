import { db } from 'src/core/db'
import type { Receipt } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { deleteReceiptMutation } from './deleteReceipt.mutation'

// Deleting is irreversible and there is no server copy — the only other record
// of a receipt is a backup file the user may never have made. A delete that
// caught a neighbouring row would be discovered as a total that no longer
// matches the bank, months later.

const receipt = (id: string): Receipt => ({
  id,
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: 1_000_000,
  currency: 'TOMAN',
  rate: null,
  amountToman: 1_000_000,
  clientId: null,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: '2026-05-10T12:00:00.000Z',
  updatedAt: '2026-05-10T12:00:00.000Z',
})

describe('deleteReceiptMutation', () => {
  it('removes the named receipt and nothing else', async () => {
    await db.receipts.bulkAdd([receipt('r1'), receipt('r2'), receipt('r3')])

    await deleteReceiptMutation({ id: 'r2' })

    expect((await db.receipts.toArray()).map((row) => row.id).sort()).toEqual(['r1', 'r3'])
  })

  it('returns the id it deleted, so the caller can name it in the undo toast', async () => {
    await db.receipts.add(receipt('r1'))

    expect(await deleteReceiptMutation({ id: 'r1' })).toBe('r1')
  })

  // A row already gone in another tab must not throw a Persian error at
  // someone whose intent has in fact been carried out.
  it('is a no-op for an id that is not there', async () => {
    await db.receipts.add(receipt('r1'))

    await expect(deleteReceiptMutation({ id: 'ghost' })).resolves.toBe('ghost')
    expect(await db.receipts.count()).toBe(1)
  })

  it('leaves the client behind, because their earlier receipts still refer to it', async () => {
    await db.clients.add({ id: 'c1', name: 'آریا', nameKey: 'آریا', createdAt: '2026-01-01T00:00:00.000Z' })
    await db.receipts.add({ ...receipt('r1'), clientId: 'c1' })

    await deleteReceiptMutation({ id: 'r1' })

    expect(await db.clients.count()).toBe(1)
  })
})
