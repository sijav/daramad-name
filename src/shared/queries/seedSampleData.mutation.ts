import { db, upsertClientByName } from 'src/core/db'
import type { Channel, Currency, Receipt } from 'src/shared/types'
import { computeToman } from 'src/shared/utils'

// Rule 7: one click fills the app with believable Persian data for testing and
// screenshots. Demo day itself must use the team's own real records.
//
// The shape of this data is deliberate — it exercises every scenario:
//   · mixed currencies with different frozen rates (scenario 1)
//   · one client at ~60% of income, tripping the concentration insight (scenario 4)
//   · Mordad left empty, to prove empty months render as zero bars
//   · receipts spread across ~10 months, so the monthly average is meaningful

interface SampleReceipt {
  monthsAgo: number
  dayOfMonth: number
  amount: number
  currency: Currency
  rate: number | null
  client: string
  channel: Channel
  note: string
}

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    monthsAgo: 0,
    dayOfMonth: 8,
    amount: 500,
    currency: 'USDT',
    rate: 98500,
    client: 'بازرگانی آریا',
    channel: 'TETHER',
    note: 'پیش‌پرداخت فاز اول طراحی',
  },
  {
    monthsAgo: 0,
    dayOfMonth: 21,
    amount: 18000000,
    currency: 'TOMAN',
    rate: null,
    client: 'استودیو نقش',
    channel: 'CARD_TO_CARD',
    note: 'ست آیکون اپلیکیشن',
  },
  {
    monthsAgo: 1,
    dayOfMonth: 4,
    amount: 1200,
    currency: 'USD',
    rate: 96200,
    client: 'بازرگانی آریا',
    channel: 'REMITTANCE',
    note: 'تسویه فاز دوم',
  },
  {
    monthsAgo: 1,
    dayOfMonth: 19,
    amount: 9500000,
    currency: 'TOMAN',
    rate: null,
    client: 'کافه رستوران هما',
    channel: 'CARD_TO_CARD',
    note: 'طراحی منو',
  },
  {
    monthsAgo: 2,
    dayOfMonth: 12,
    amount: 750,
    currency: 'USDT',
    rate: 94800,
    client: 'بازرگانی آریا',
    channel: 'TETHER',
    note: 'ری‌دیزاین صفحه محصول',
  },
  {
    monthsAgo: 3,
    dayOfMonth: 2,
    amount: 22000000,
    currency: 'TOMAN',
    rate: null,
    client: 'شرکت داده‌پرداز',
    channel: 'REMITTANCE',
    note: 'داشبورد تحلیلی',
  },
  {
    monthsAgo: 3,
    dayOfMonth: 27,
    amount: 400,
    currency: 'USDT',
    rate: 92100,
    client: 'استودیو نقش',
    channel: 'TETHER',
    note: 'اصلاحات نهایی',
  },
  // monthsAgo 4 intentionally omitted — the empty-month edge case.
  {
    monthsAgo: 5,
    dayOfMonth: 15,
    amount: 1800,
    currency: 'USD',
    rate: 89500,
    client: 'بازرگانی آریا',
    channel: 'REMITTANCE',
    note: 'قرارداد سه‌ماهه',
  },
  {
    monthsAgo: 6,
    dayOfMonth: 9,
    amount: 12000000,
    currency: 'TOMAN',
    rate: null,
    client: 'کافه رستوران هما',
    channel: 'CARD_TO_CARD',
    note: 'بنر و پست شبکه اجتماعی',
  },
  {
    monthsAgo: 7,
    dayOfMonth: 23,
    amount: 600,
    currency: 'USDT',
    rate: 87300,
    client: 'بازرگانی آریا',
    channel: 'TETHER',
    note: 'لندینگ کمپین',
  },
  {
    monthsAgo: 8,
    dayOfMonth: 6,
    amount: 15000000,
    currency: 'TOMAN',
    rate: null,
    client: 'شرکت داده‌پرداز',
    channel: 'CARD_TO_CARD',
    note: 'مشاوره UX',
  },
  {
    monthsAgo: 9,
    dayOfMonth: 17,
    amount: 950,
    currency: 'USD',
    rate: 84600,
    client: 'بازرگانی آریا',
    channel: 'REMITTANCE',
    note: 'بازطراحی هویت بصری',
  },
  {
    monthsAgo: 10,
    dayOfMonth: 11,
    amount: 7000000,
    currency: 'TOMAN',
    rate: null,
    client: 'استودیو نقش',
    channel: 'OTHER',
    note: 'پروژه کوچک تصویرسازی',
  },
]

/** Adds sample data alongside anything already there; it never clears first. */
export const seedSampleDataMutation = async (): Promise<number> => {
  const now = new Date()

  const receipts: Receipt[] = []
  for (const sample of SAMPLE_RECEIPTS) {
    const client = await upsertClientByName(sample.client)
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
      note: sample.note,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  await db.receipts.bulkAdd(receipts)
  return receipts.length
}
