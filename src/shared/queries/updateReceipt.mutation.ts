import { msg } from '@lingui/core/macro'
import { db, upsertClientByName } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import type { Receipt } from 'src/shared/types'
import { computeToman } from 'src/shared/utils'
import type { CreateReceiptRequest } from './createReceipt.mutation'

export interface UpdateReceiptRequest extends CreateReceiptRequest {
  id: string
}

/**
 * Edits a receipt and re-freezes its toman value from the rate now on the form.
 *
 * Note this recomputes `amountToman` rather than preserving the old one. That is
 * correct: the user is deliberately correcting the record, and the rate field
 * they are looking at is the one that should win. The freeze rule protects
 * against *time* changing a record, not against the user editing it.
 */
export const updateReceiptMutation = async ({
  id,
  occurredAt,
  amountOriginal,
  currency,
  rate,
  clientName,
  channel,
  note,
}: UpdateReceiptRequest): Promise<Receipt> => {
  const existing = await db.receipts.get(id)
  if (!existing) {
    throw new Error(i18n._(msg`این دریافتی پیدا نشد؛ ممکنه قبلاً حذفش کرده باشی.`))
  }

  const client = await upsertClientByName(clientName)
  const effectiveRate = currency === 'TOMAN' ? null : rate

  const updated: Receipt = {
    ...existing,
    occurredAt,
    amountOriginal,
    currency,
    rate: effectiveRate,
    amountToman: computeToman(amountOriginal, currency, effectiveRate),
    clientId: client?.id ?? null,
    channel,
    note: note.trim() || null,
    updatedAt: new Date().toISOString(),
  }

  await db.receipts.put(updated)
  return updated
}
