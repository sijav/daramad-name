import { db } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import type { Client, DateRange, Receipt } from 'src/shared/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { getClientSharesQuery, getClientSharesQueryKey } from './getClientShares.query'

// Scenario 4: the donut and the dependency warning beside it.
//
// The warning is advice about someone's livelihood, "over half of what you
// earn comes from one place", so it has to fire on the real ratio rather than
// on the rounded number the legend prints. Comparing the rounded value moved
// the real boundary to 50.5%: a client at a true 50.4% rounded to 50, `50 > 50`
// was false, and the freelancer who most needed the warning did not get one.

const ALL_OF_TIME: DateRange = { from: '2000-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' }

const call = (range: DateRange = ALL_OF_TIME) => getClientSharesQuery({ queryKey: getClientSharesQueryKey(range) } as never)

const client = (id: string, name: string): Client => ({ id, name, nameKey: name.toLowerCase(), createdAt: '2026-01-01T00:00:00.000Z' })

const receipt = (id: string, clientId: string | null, amountToman: number, occurredAt = '2026-05-10T12:00:00.000Z'): Receipt => ({
  id,
  occurredAt,
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

// The unassigned and unknown buckets are labelled through lingui.
beforeAll(async () => {
  await activateLocale('fa-IR')
})

describe('the shares themselves', () => {
  it('gives each client its percentage of the grand total, largest first', async () => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما'), client('zarin', 'زرین')])
    await db.receipts.bulkAdd([receipt('r1', 'aria', 50_000_000), receipt('r2', 'homa', 30_000_000), receipt('r3', 'zarin', 20_000_000)])

    const { shares } = await call()

    expect(shares.map((share) => [share.clientName, share.percentage])).toEqual([
      ['آریا', 50],
      ['هما', 30],
      ['زرین', 20],
    ])
  })

  it('adds a client’s several receipts together before taking their share', async () => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما')])
    await db.receipts.bulkAdd([receipt('r1', 'aria', 30_000_000), receipt('r2', 'aria', 30_000_000), receipt('r3', 'homa', 40_000_000)])

    const { shares } = await call()

    expect(shares[0]).toMatchObject({ clientId: 'aria', totalToman: 60_000_000, percentage: 60 })
  })

  // The donut sits under a date filter. Taking the percentage against the
  // lifetime total instead of the selected period would draw slices that do not
  // add up to the panel above them.
  it('takes percentages against the total of the selected period only', async () => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما')])
    await db.receipts.bulkAdd([
      receipt('inside-a', 'aria', 30_000_000, '2026-05-10T12:00:00.000Z'),
      receipt('inside-b', 'homa', 10_000_000, '2026-05-20T12:00:00.000Z'),
      receipt('outside', 'aria', 900_000_000, '2025-05-10T12:00:00.000Z'),
    ])

    const { shares } = await call({ from: '2026-05-01T00:00:00.000Z', to: '2026-05-31T23:59:59.999Z' })

    expect(shares.map((share) => share.percentage)).toEqual([75, 25])
    expect(shares.reduce((sum, share) => sum + share.totalToman, 0)).toBe(40_000_000)
  })

  it('collects the receipts with no client into one labelled bucket', async () => {
    await db.clients.add(client('aria', 'آریا'))
    await db.receipts.bulkAdd([receipt('r1', 'aria', 70_000_000), receipt('r2', null, 30_000_000)])

    const { shares } = await call()

    expect(shares[1]).toMatchObject({ clientName: 'بدون مشتری', percentage: 30 })
  })

  // Income whose client row has gone still belongs in the total; dropping it
  // would make every other slice look bigger than it is.
  it('still counts a receipt whose client row is missing', async () => {
    await db.receipts.bulkAdd([receipt('r1', 'vanished', 40_000_000), receipt('r2', null, 60_000_000)])

    const { shares } = await call()

    expect(shares.find((share) => share.clientId === 'vanished')).toMatchObject({ clientName: 'نامشخص', percentage: 40 })
  })

  it('returns nothing at all for a period with no income, rather than a chart of zeroes', async () => {
    expect(await call()).toEqual({ shares: [], insight: null })
  })
})

describe('the concentration warning', () => {
  const seedSplit = async (ariaToman: number, homaToman: number) => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما')])
    await db.receipts.bulkAdd([receipt('r1', 'aria', ariaToman), receipt('r2', 'homa', homaToman)])
  }

  it('stays quiet at exactly half, because the rule is strictly above', async () => {
    await seedSplit(500_000_000, 500_000_000)

    expect((await call()).insight).toBeNull()
  })

  // The regression. A true 50.4% prints as «۵۰٪» in the legend, and the warning
  // still has to fire, the freelancer really is taking over half their income
  // from one client.
  it('fires just above half, even though the printed percentage still reads fifty', async () => {
    await seedSplit(504_000_000, 496_000_000)

    const { insight } = await call()

    expect(insight).toEqual({ clientName: 'آریا', percentage: 50 })
  })

  it('names the top client and the share the legend shows beside it', async () => {
    await seedSplit(700_000_000, 300_000_000)

    expect((await call()).insight).toEqual({ clientName: 'آریا', percentage: 70 })
  })

  it('stays quiet when income is spread across several clients', async () => {
    await db.clients.bulkAdd([client('aria', 'آریا'), client('homa', 'هما'), client('zarin', 'زرین')])
    await db.receipts.bulkAdd([receipt('r1', 'aria', 40_000_000), receipt('r2', 'homa', 35_000_000), receipt('r3', 'zarin', 25_000_000)])

    expect((await call()).insight).toBeNull()
  })

  // Most of the income sitting in the unassigned bucket means the user has not
  // filled in client names. That is a data-hygiene problem, not a dependency
  // risk, and telling someone they depend on «بدون مشتری» is nonsense.
  it('never raises a dependency risk against the unassigned bucket', async () => {
    await db.clients.add(client('aria', 'آریا'))
    await db.receipts.bulkAdd([receipt('r1', null, 700_000_000), receipt('r2', 'aria', 300_000_000)])

    const { shares, insight } = await call()

    expect(shares[0].clientName).toBe('بدون مشتری')
    expect(insight).toBeNull()
  })

  it('fires for a single client who is the only source of income', async () => {
    await seedSplit(1_000_000_000, 0)

    expect((await call()).insight).toMatchObject({ clientName: 'آریا', percentage: 100 })
  })
})
