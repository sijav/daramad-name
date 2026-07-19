import { db } from 'src/core/db'
import type { Client } from 'src/shared/types'

export const clientsQueryKey = ['clients'] as const

export interface ClientWithTotals extends Client {
  totalToman: number
  receiptCount: number
}

/** Clients with their lifetime totals, ordered by earnings — the filter dropdown and the client list both want this order. */
export const getClientsQuery = async (): Promise<ClientWithTotals[]> => {
  const [clients, receipts] = await Promise.all([db.clients.toArray(), db.receipts.toArray()])

  const totals = new Map<string, { totalToman: number; receiptCount: number }>()
  for (const receipt of receipts) {
    if (!receipt.clientId) {
      continue
    }
    const current = totals.get(receipt.clientId) ?? { totalToman: 0, receiptCount: 0 }
    current.totalToman += receipt.amountToman
    current.receiptCount += 1
    totals.set(receipt.clientId, current)
  }

  return clients
    .map((client) => ({ ...client, ...(totals.get(client.id) ?? { totalToman: 0, receiptCount: 0 }) }))
    .sort((left, right) => right.totalToman - left.totalToman)
}
