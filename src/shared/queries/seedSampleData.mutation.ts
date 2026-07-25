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
//   - one salary client pays most months, near the same day give or take a
//     couple, the way a monthly retainer lands. Paid in Tether, so the frozen-
//     rate case shows up constantly, and large enough to sit well past half the
//     year's income and trip the concentration insight (scenario 4)
//   - a pool of one-off clients adds gigs on top: with the salary in, most
//     months none, sometimes one, rarely up to four; on a month the salary
//     skips, one to five gigs cover for it, so a month always runs one to five
//     rows
//   - four years, earlier ones lighter, so the year picker changes the page
//   - amounts follow a power law: a round million is ordinary, an exact ten
//     thousand rare, so nobody is paid ۲۲٬۳۴۷٬۸۹۱
//   - every month carries the salary or a gig, so no month draws blank in the
//     year view
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

// A one-off gig is at most this much.
const GIG_MAX_TOMAN = 15_000_000

// The single salary: one retainer paid most months, in Tether, large enough to
// dominate the year. The amount is the target Toman before the month's rate and
// a little jitter are applied to it. Now and then it skips a month, and that
// month leans on gigs instead.
const SALARY_CLIENT = msg`Aria Trading`
const SALARY_CURRENCY: Currency = 'USDT'
const SALARY_MONTHLY_TOMAN = 90_000_000
const SALARY_REGULARITY = 0.85
const SALARY_NOTE = msg`Monthly retainer`

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

const GIG_NOTES: readonly MessageDescriptor[] = [
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

// Gigs in a month, weighted along a rarity ladder. When the salary is there the
// ladder starts at none (the common month) and reaches four (legendary), so the
// month runs one to five rows. On a month the salary skips, it shifts up a rung,
// one to five gigs, so the month still fills and a five-gig month is its own
// kind of legendary.
const GIGS_WITH_SALARY = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4] as const
const GIGS_WITHOUT_SALARY = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5] as const

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
  // Days past the first of its calendar month, so the salary can hold a payday
  // while gigs scatter across the month.
  dayOffset: number
  client: MessageDescriptor
  currency: Currency
  amountOriginal: number
  rate: number | null
  note: MessageDescriptor
}

interface EmitSpec {
  client: MessageDescriptor
  currency: Currency
  targetToman: number
  monthsAgo: number
  tomanStep: number
  dayOffset: number
  note: MessageDescriptor
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
  const emit = ({ client, currency, targetToman, monthsAgo, tomanStep, dayOffset, note }: EmitSpec) => {
    if (currency === 'TOMAN') {
      drafts.push({ monthsAgo, dayOffset, client, currency, amountOriginal: roundToStep(targetToman, tomanStep), rate: null, note })
      return
    }
    const rate = rateFor(currency, monthsAgo)
    drafts.push({
      monthsAgo,
      dayOffset,
      client,
      currency,
      amountOriginal: roundToStep(targetToman / rate, currency === 'USDT' ? 50 : 100),
      rate,
      note,
    })
  }

  // The salary lands on the same day of the month across the whole history, give
  // or take a couple, the way a payday clusters.
  const payday = randInt(3, 25)

  for (let yearBack = 0; yearBack < YEAR_SCALE.length; yearBack += 1) {
    const scale = YEAR_SCALE[yearBack]

    for (let month = 0; month < 12; month += 1) {
      const monthsAgo = month + yearBack * 12

      const hasSalary = Math.random() < SALARY_REGULARITY
      if (hasSalary) {
        emit({
          client: SALARY_CLIENT,
          currency: SALARY_CURRENCY,
          targetToman: SALARY_MONTHLY_TOMAN * scale * rand(0.95, 1.1),
          monthsAgo,
          tomanStep: UNCOMMON,
          dayOffset: payday - 1 + randInt(-2, 2),
          note: SALARY_NOTE,
        })
      }

      for (const gigClient of pickDistinct(GIG_CLIENTS, pick(hasSalary ? GIGS_WITH_SALARY : GIGS_WITHOUT_SALARY))) {
        emit({
          client: gigClient,
          currency: pick(['TOMAN', 'TOMAN', 'USDT', 'USD'] as const),
          targetToman: roundToStep(rand(3_000_000, GIG_MAX_TOMAN) * scale, pick(STEPS)),
          monthsAgo,
          tomanStep: pick(STEPS),
          dayOffset: randInt(0, 27),
          note: pick(GIG_NOTES),
        })
      }
    }
  }

  // Count months in the user's own calendar, so the salary lands once per
  // calendar month rather than twice at the boundary where a Gregorian month
  // spills across two Jalali ones.
  const { calendar } = await readSettings()
  const now = new Date()
  const receipts: Receipt[] = []
  for (const draft of drafts) {
    const client = await upsertClientByName(i18n._(draft.client))
    const monthStart = startOfMonthsAgo(now, draft.monthsAgo, calendar)
    // Past months get the full window; the current month only runs up to today,
    // so nothing is dated in the future and the salary shifts earlier rather
    // than spilling past the clamp.
    const lastDay = draft.monthsAgo === 0 ? Math.min(27, differenceInCalendarDays(now, monthStart)) : 27
    const occurred = monthStart
    occurred.setDate(occurred.getDate() + Math.max(0, Math.min(draft.dayOffset, lastDay)))
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
      note: i18n._(draft.note),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  await db.receipts.bulkAdd(receipts)
  return receipts.length
}
