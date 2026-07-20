import { msg } from '@lingui/core/macro'
import { assertValidReceipt, db, upsertClientByName } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import type { Channel, Currency, Receipt } from 'src/shared/types'
import { computeToman } from 'src/shared/utils'

export interface CreateReceiptRequest {
  occurredAt: string
  amountOriginal: number
  currency: Currency
  /** Toman per unit. Required for non-toman currencies, ignored for TOMAN. */
  rate: number | null
  clientName: string
  channel: Channel
  note: string
}

/**
 * Writes a receipt, freezing its toman value.
 *
 * `amountToman` is computed here, once, and stored. Nothing recomputes it on
 * read. That is the whole point of scenario 1: a receipt logged when Tether was
 * 98,500 must still read 246,250,000 toman after Tether moves, because that is
 * what the freelancer actually received.
 */
export const createReceiptMutation = async ({
  occurredAt,
  amountOriginal,
  currency,
  rate,
  clientName,
  channel,
  note,
}: CreateReceiptRequest): Promise<Receipt> => {
  const client = await upsertClientByName(clientName)
  const effectiveRate = currency === 'TOMAN' ? null : rate
  const now = new Date().toISOString()

  const receipt: Receipt = {
    id: window.crypto.randomUUID(),
    occurredAt,
    amountOriginal,
    currency,
    rate: effectiveRate,
    amountToman: computeToman(amountOriginal, currency, effectiveRate),
    clientId: client?.id ?? null,
    channel,
    note: note.trim() || null,
    createdAt: now,
    updatedAt: now,
  }

  // Validated before the write, so a bad row can never reach the ledger.
  assertValidReceipt(receipt, i18n._(msg`this receipt`))
  await db.receipts.add(receipt)
  return receipt
}
