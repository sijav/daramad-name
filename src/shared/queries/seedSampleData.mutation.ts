import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { differenceInCalendarDays } from 'date-fns'
import { db, readSettings, upsertClientByName } from 'src/core/db'
import { i18n } from 'src/core/i18n'
import type { Channel, Currency, Receipt } from 'src/shared/types'
import { computeToman, startOfMonthsAgo } from 'src/shared/utils'

// One click fills the app with four years of believable sample data for testing
// and screenshots, GENERATED FRESH each time, so no two seeds look alike. Demo
// day itself must use the team's own real records.
//
// The shape is deliberate:
//   - two steady clients pay most months (a big foreign retainer and a smaller
//     Toman one), the way a freelancer's regular income does
//   - a pool of one-off clients adds one or two gigs a month, up to five
//   - four years, earlier ones lighter, so the year picker changes the page
//   - amounts follow a power law: a round million is ordinary, an exact ten
//     thousand rare, so nobody is paid ۲۲٬۳۴۷٬۸۹۱
//   - the retainer earns several times the rest each month, so it stays the top
//     client well past half the income and the concentration insight fires
//     (scenario 4)
//   - every month in range carries at least one gig, so no month draws as a
//     blank in the year view
//
// Client and note names go through `msg`, so a seed made in English reads in
// English and one made in Persian reads in Persian.

const COMMON = 1_000_000
const UNCOMMON = 500_000
const RARE = 100_000
const LEGENDARY = 10_000 // :D
// Weighted so a round figure is ordinary and a ten-thousand precise one is rare.
const STEPS = [COMMON, COMMON, COMMON, UNCOMMON, UNCOMMON, RARE, LEGENDARY] as const

// Four years, each lighter than the last.
const YEAR_SCALE = [1, 0.82, 0.65, 0.5] as const

// A one-off gig is at most this much, and there are at most five a month.
const GIG_MAX_TOMAN = 15_000_000
const GIGS_MAX = 5

interface SteadyClient {
  client: MessageDescriptor
  currency: Currency
  monthlyToman: number
  // How often it actually pays, so even a steady client misses the odd month.
  regularity: number
}

const STEADY: readonly SteadyClient[] = [
  // The retainer: several times the second client plus a typical month of gigs,
  // so across four years it sits comfortably past half the income. Paid in
  // Tether, the way a foreign retainer is.
  { client: msg`Aria Trading`, currency: 'USDT', monthlyToman: 150_000_000, regularity: 1 },
  { client: msg`Dadepardaz Co.`, currency: 'TOMAN', monthlyToman: 38_000_000, regularity: 0.85 },
]

const GIG_CLIENTS: readonly MessageDescriptor[] = [
  msg`Naghsh Studio`,
  msg`Homa Cafe`,
  msg`Kavir Tech`,
  msg`Simorgh Media`,
  msg`Roshan Labs`,
  msg`Setareh Design`,
  msg`Parsa Group`,
  msg`Mehr Agency`,
  msg`Baran Studio`,
  msg`Avang Interactive`,
  msg`Nova Print`,
  msg`Zarin Apps`,
  msg`Pardis Web`,
  msg`Borna Studio`,
]

const NOTES: readonly MessageDescriptor[] = [
  msg`Monthly retainer`,
  msg`Deposit for design phase one`,
  msg`App icon set`,
  msg`Phase two settlement`,
  msg`Menu design`,
  msg`Product page redesign`,
  msg`Analytics dashboard`,
  msg`Checkout flow`,
  msg`Three-month contract`,
  msg`Banner and social posts`,
  msg`Campaign landing page`,
  msg`Rebrand rollout`,
  msg`UX consulting`,
  msg`Visual identity`,
  msg`Illustration set`,
  msg`Icon refresh`,
  msg`Event poster`,
]

// How many gigs land in a month, weighted so two is the common month and one a
// little less common, with three (rare), four (very rare) and five (legendary)
// each falling off sharply from the last.
const GIG_COUNTS = [2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 3, 3, 3, 4, 4, GIGS_MAX] as const

const rand = (min: number, max: number): number => min + Math.random() * (max - min)
const randInt = (min: number, max: number): number => Math.floor(rand(min, max + 1))
const pick = <T>(list: readonly T[]): T => list[randInt(0, list.length - 1)]
const roundToStep = (value: number, step: number): number => Math.max(step, Math.round(value / step) * step)

// `count` different entries from the list, so a month's gigs come from distinct
// clients and never read as one receipt entered twice.
const pickDistinct = <T>(list: readonly T[], count: number): T[] => {
  const pool = [...list]
  const chosen: T[] = []
  while (chosen.length < count && pool.length > 0) {
    chosen.push(pool.splice(randInt(0, pool.length - 1), 1)[0])
  }
  return chosen
}

// A foreign receipt is frozen at the rate of its month, and the Toman weakened
// over the years, so older receipts sit at a lower rate. A little jitter keeps
// two seeds from sharing a rate.
const rateFor = (currency: Currency, monthsAgo: number): number =>
  Math.round((currency === 'USDT' ? 98_500 : 96_000) - monthsAgo * 850 + rand(-600, 600))

const channelFor = (currency: Currency): Channel =>
  currency === 'USDT' ? 'TETHER' : currency === 'USD' ? 'REMITTANCE' : pick(['CARD_TO_CARD', 'OTHER'] as const)

interface Draft {
  monthsAgo: number
  client: MessageDescriptor
  currency: Currency
  amountOriginal: number
  rate: number | null
}

export const seedSampleDataMutation = async (): Promise<number> => {
  // Sample data is a fresh set, not an addition: wipe the ledger first so
  // pressing Fill twice cannot stack two seeds into the same month. Personal
  // details are left untouched. When there is real data to lose, the UI guards
  // this behind a typed confirmation.
  await db.receipts.clear()
  await db.clients.clear()

  const drafts: Draft[] = []

  // Emit one receipt for a target Toman amount. A foreign one keeps its own
  // rate and carries the units that rate implies, so the frozen Toman lands
  // where intended whatever the rate did that month.
  const emit = (client: MessageDescriptor, currency: Currency, targetToman: number, monthsAgo: number, tomanStep: number) => {
    if (currency === 'TOMAN') {
      drafts.push({ monthsAgo, client, currency, amountOriginal: roundToStep(targetToman, tomanStep), rate: null })
      return
    }
    const rate = rateFor(currency, monthsAgo)
    drafts.push({ monthsAgo, client, currency, amountOriginal: roundToStep(targetToman / rate, currency === 'USDT' ? 50 : 100), rate })
  }

  for (let yearBack = 0; yearBack < YEAR_SCALE.length; yearBack += 1) {
    const scale = YEAR_SCALE[yearBack]

    for (let month = 0; month < 12; month += 1) {
      const monthsAgo = month + yearBack * 12

      for (const steady of STEADY) {
        if (Math.random() > steady.regularity) continue
        emit(steady.client, steady.currency, steady.monthlyToman * scale * rand(0.95, 1.1), monthsAgo, UNCOMMON)
      }

      for (const gigClient of pickDistinct(GIG_CLIENTS, pick(GIG_COUNTS))) {
        emit(
          gigClient,
          pick(['TOMAN', 'TOMAN', 'USDT', 'USD'] as const),
          roundToStep(rand(3_000_000, GIG_MAX_TOMAN) * scale, pick(STEPS)),
          monthsAgo,
          pick(STEPS),
        )
      }
    }
  }

  // Count months in the user's own calendar, so a monthly retainer lands once
  // per Jalali month rather than twice at the boundary where a Gregorian month
  // spills across two Jalali ones.
  const { calendar } = await readSettings()
  const now = new Date()
  const receipts: Receipt[] = []
  for (const draft of drafts) {
    const client = await upsertClientByName(i18n._(draft.client))
    const monthStart = startOfMonthsAgo(now, draft.monthsAgo, calendar)
    // Every past month gets the full 28-day window; the current month only runs
    // up to today, so nothing is dated in the future.
    const daysAvailable = draft.monthsAgo === 0 ? differenceInCalendarDays(now, monthStart) : 27
    const occurred = monthStart
    occurred.setDate(occurred.getDate() + randInt(0, Math.min(27, daysAvailable)))
    occurred.setHours(12, 0, 0, 0)
    const timestamp = new Date().toISOString()

    receipts.push({
      id: window.crypto.randomUUID(),
      occurredAt: occurred.toISOString(),
      amountOriginal: draft.amountOriginal,
      currency: draft.currency,
      rate: draft.rate,
      amountToman: computeToman(draft.amountOriginal, draft.currency, draft.rate),
      clientId: client?.id ?? null,
      channel: channelFor(draft.currency),
      note: i18n._(pick(NOTES)),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  await db.receipts.bulkAdd(receipts)
  return receipts.length
}
