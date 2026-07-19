import { msg } from '@lingui/core/macro'
import type { QueryFunctionContext } from '@tanstack/react-query'
import { db } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import { CONCENTRATION_THRESHOLD, type ClientShare, type ConcentrationInsight, type DateRange } from 'src/shared/types'

export const getClientSharesQueryKey = (range: DateRange) => ['client-shares', range] as const

export interface ClientSharesResult {
  shares: ClientShare[]
  /** Non-null only when the top client is over the threshold. */
  insight: ConcentrationInsight | null
}

const UNASSIGNED_ID = '__unassigned__'

/**
 * Client-share breakdown plus the dependency warning.
 *
 * The insight fires above 50% — the brief's rule. Scenario 4's «۷۰٪» is one
 * example of that rule firing, not a second threshold.
 */
export const getClientSharesQuery = async ({
  queryKey: [, range],
}: QueryFunctionContext<ReturnType<typeof getClientSharesQueryKey>>): Promise<ClientSharesResult> => {
  const receipts = await db.receipts.where('occurredAt').between(range.from, range.to, true, true).toArray()
  const clients = await db.clients.toArray()
  const namesById = new Map(clients.map((client) => [client.id, client.name]))

  const totals = new Map<string, number>()
  for (const receipt of receipts) {
    const key = receipt.clientId ?? UNASSIGNED_ID
    totals.set(key, (totals.get(key) ?? 0) + receipt.amountToman)
  }

  const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0)
  if (grandTotal === 0) {
    return { shares: [], insight: null }
  }

  const shares: ClientShare[] = [...totals.entries()]
    .map(([clientId, totalToman]) => ({
      clientId,
      clientName: clientId === UNASSIGNED_ID ? i18n._(msg`بدون مشتری`) : (namesById.get(clientId) ?? i18n._(msg`نامشخص`)),
      totalToman,
      percentage: Math.round((totalToman / grandTotal) * 1000) / 10,
    }))
    .sort((left, right) => right.totalToman - left.totalToman)

  const top = shares[0]
  // An "unassigned" bucket over 50% is a data-hygiene problem, not a client
  // concentration risk, so it must not raise the dependency warning.
  const insight =
    top && top.clientId !== UNASSIGNED_ID && top.percentage > CONCENTRATION_THRESHOLD
      ? { clientName: top.clientName, percentage: top.percentage }
      : null

  return { shares, insight }
}
