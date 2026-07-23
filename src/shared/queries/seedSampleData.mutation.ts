import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { db, upsertClientByName } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import type { Channel, Currency, Receipt } from 'src/shared/types'
import { computeToman } from 'src/shared/utils'

// Rule 7: one click fills the app with believable Persian data for testing and
// screenshots. Demo day itself must use the team's own real records.
//
// The shape of this data is deliberate — it exercises every scenario:
//   · mixed currencies with different frozen rates (scenario 1)
//   · Aria Trading at ~81% of the 649,980,000 total — well past the 50% the
//     concentration insight fires on (scenario 4). The amounts and rates are
//     pinned by seedSampleData.mutation.test.ts, so change them together.
//   · the month four back left empty, to prove empty months render as zero
//     bars. Which Jalali month that is depends on when the button is pressed.
//   · receipts spread across ~10 months, so the monthly average is meaningful

interface SampleReceipt {
  monthsAgo: number
  dayOfMonth: number
  amount: number
  currency: Currency
  rate: number | null
  client: MessageDescriptor
  channel: Channel
  note: MessageDescriptor
}

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    monthsAgo: 0,
    dayOfMonth: 8,
    amount: 500,
    currency: 'USDT',
    rate: 98500,
    client: msg`Aria Trading`,
    channel: 'TETHER',
    note: msg`Deposit for design phase one`,
  },
  {
    monthsAgo: 0,
    dayOfMonth: 21,
    amount: 18000000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Naghsh Studio`,
    channel: 'CARD_TO_CARD',
    note: msg`App icon set`,
  },
  {
    monthsAgo: 1,
    dayOfMonth: 4,
    amount: 1200,
    currency: 'USD',
    rate: 96200,
    client: msg`Aria Trading`,
    channel: 'REMITTANCE',
    note: msg`Phase two settlement`,
  },
  {
    monthsAgo: 1,
    dayOfMonth: 19,
    amount: 9500000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Homa Cafe`,
    channel: 'CARD_TO_CARD',
    note: msg`Menu design`,
  },
  {
    monthsAgo: 2,
    dayOfMonth: 12,
    amount: 750,
    currency: 'USDT',
    rate: 94800,
    client: msg`Aria Trading`,
    channel: 'TETHER',
    note: msg`Product page redesign`,
  },
  {
    monthsAgo: 3,
    dayOfMonth: 2,
    amount: 22000000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Dadepardaz Co.`,
    channel: 'REMITTANCE',
    note: msg`Analytics dashboard`,
  },
  {
    monthsAgo: 3,
    dayOfMonth: 27,
    amount: 400,
    currency: 'USDT',
    rate: 92100,
    client: msg`Naghsh Studio`,
    channel: 'TETHER',
    note: msg`Final revisions`,
  },
  // monthsAgo 4 intentionally omitted — the empty-month edge case.
  {
    monthsAgo: 5,
    dayOfMonth: 15,
    amount: 1800,
    currency: 'USD',
    rate: 89500,
    client: msg`Aria Trading`,
    channel: 'REMITTANCE',
    note: msg`Three-month contract`,
  },
  {
    monthsAgo: 6,
    dayOfMonth: 9,
    amount: 12000000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Homa Cafe`,
    channel: 'CARD_TO_CARD',
    note: msg`Banner and social posts`,
  },
  {
    monthsAgo: 7,
    dayOfMonth: 23,
    amount: 600,
    currency: 'USDT',
    rate: 87300,
    client: msg`Aria Trading`,
    channel: 'TETHER',
    note: msg`Campaign landing page`,
  },
  {
    monthsAgo: 8,
    dayOfMonth: 6,
    amount: 15000000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Dadepardaz Co.`,
    channel: 'CARD_TO_CARD',
    note: msg`UX consulting`,
  },
  {
    monthsAgo: 9,
    dayOfMonth: 17,
    amount: 950,
    currency: 'USD',
    rate: 84600,
    client: msg`Aria Trading`,
    channel: 'REMITTANCE',
    note: msg`Visual identity redesign`,
  },
  {
    monthsAgo: 10,
    dayOfMonth: 11,
    amount: 7000000,
    currency: 'TOMAN',
    rate: null,
    client: msg`Naghsh Studio`,
    channel: 'OTHER',
    note: msg`Small illustration project`,
  },
]

/** Adds sample data alongside anything already there; it never clears first. */
export const seedSampleDataMutation = async (): Promise<number> => {
  const now = new Date()

  const receipts: Receipt[] = []
  for (const sample of SAMPLE_RECEIPTS) {
    const client = await upsertClientByName(i18n._(sample.client))
    const occurred = new Date(now.getFullYear(), now.getMonth() - sample.monthsAgo, sample.dayOfMonth, 12, 0, 0)
    const timestamp = new Date().toISOString()

    receipts.push({
      id: window.crypto.randomUUID(),
      occurredAt: occurred.toISOString(),
      amountOriginal: sample.amount,
      currency: sample.currency,
      rate: sample.rate,
      amountToman: computeToman(sample.amount, sample.currency, sample.rate),
      clientId: client?.id ?? null,
      channel: sample.channel,
      note: i18n._(sample.note),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  await db.receipts.bulkAdd(receipts)
  return receipts.length
}
