import { db } from 'src/core/db'
import type { Client, Receipt } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { getClientsQuery } from './getClients.query'

// Feeds both the ledger's client filter and the top-clients panel. The totals
// here are the ones a freelancer reads to decide who to chase for work, so
// attributing income to the wrong client, or losing a client from the list
// entirely, changes a decision rather than just a display.

const client = (id: string, name: string): Client => ({ id, name, nameKey: name.toLowerCase(), createdAt: '2026-01-01T00:00:00.000Z' })

const receipt = (id: string, clientId: string | null, amountToman: number): Receipt => ({
  id,
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: amountToman,
  currency: 'TOMAN',
  rate: null,
  amountToman,
  clientId,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('getClientsQuery', () => {
  it('totals each client’s receipts and orders them by earnings', async () => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما'), client('zarin', 'زرین')])
    await db.receipts.bulkAdd([
      receipt('r1', 'homa', 10_000_000),
      receipt('r2', 'aria', 30_000_000),
      receipt('r3', 'aria', 20_000_000),
      receipt('r4', 'zarin', 40_000_000),
    ])

    const clients = await getClientsQuery()

    expect(clients.map((row) => [row.id, row.totalToman, row.receiptCount])).toEqual([
      ['aria', 50_000_000, 2],
      ['zarin', 40_000_000, 1],
      ['homa', 10_000_000, 1],
    ])
  })

  // A client whose only receipt was deleted must stay in the filter dropdown,
  // otherwise the user cannot search for the period before that.
  it('keeps a client with no receipts, at zero', async () => {
    await db.clients.add(client('quiet', 'ساکت'))

    expect(await getClientsQuery()).toEqual([expect.objectContaining({ id: 'quiet', totalToman: 0, receiptCount: 0 })])
  })

  it('does not attribute unassigned income to anybody', async () => {
    await db.clients.add(client('aria', 'آریا'))
    await db.receipts.bulkAdd([receipt('r1', 'aria', 10_000_000), receipt('r2', null, 90_000_000)])

    const [aria] = await getClientsQuery()

    expect(aria.totalToman).toBe(10_000_000)
    expect(await getClientsQuery()).toHaveLength(1)
  })

  it('carries the stored client fields through, not just the totals', async () => {
    await db.clients.add(client('aria', 'آریا'))

    expect((await getClientsQuery())[0]).toMatchObject({ name: 'آریا', nameKey: 'آریا', createdAt: '2026-01-01T00:00:00.000Z' })
  })

  it('returns an empty list rather than throwing when there are no clients', async () => {
    expect(await getClientsQuery()).toEqual([])
  })
})
