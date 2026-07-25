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
//   - four years of history, so the year picker changes the page
//   - gig amounts follow a power law: a round million is ordinary, an exact
//     fifty thousand rare, so nobody is paid ۲۲٬۳۴۷٬۸۹۱
//   - every month carries the salary or a gig, so no month draws blank in the
//     year view
//
// Client and note names go through `msg`, so a seed made in English reads in
// English and one made in Persian reads in Persian.

// The step a gig amount is rounded to, weighted: a round million is the common
// case, a half-million uncommon, and the exact 100k and 50k figures rare and
// legendary, so most gigs read as tidy sums and the odd one lands precise.
const GIG_STEPS = [
  1_000_000, 1_000_000, 1_000_000, 1_000_000, 1_000_000, 1_000_000, 500_000, 500_000, 500_000, 100_000, 100_000, 50_000,
] as const

// Four years of history.
const YEARS = 4

// A gig runs from a few million up to the low tens of millions, kept well under
// the salary so the retainer stays the top client and the concentration insight
// keeps firing whatever the dice do.
const GIG_MIN_TOMAN = 3_000_000
const GIG_MAX_TOMAN = 30_000_000

// The single salary: one retainer paid most months, in Tether, large enough to
// dominate the year. Its size is drawn once per seed, fifty to two hundred
// million Toman in whole millions, then held steady month to month the way a
// real salary is, so it differs between seeds but never down the page of one.
// Now and then it skips a month, and that month leans on gigs instead.
const SALARY_CLIENT = msg`Aria Trading`
const SALARY_CURRENCY: Currency = 'USDT'
const SALARY_MIN_TOMAN = 50_000_000
const SALARY_MAX_TOMAN = 200_000_000
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
  // or take a couple, the way a payday clusters, and is a fixed figure for this
  // whole seed drawn once here.
  const payday = randInt(3, 25)
  const salaryToman = roundToStep(rand(SALARY_MIN_TOMAN, SALARY_MAX_TOMAN), 1_000_000)

  for (let monthsAgo = 0; monthsAgo < YEARS * 12; monthsAgo += 1) {
    const hasSalary = Math.random() < SALARY_REGULARITY
    if (hasSalary) {
      emit({
        client: SALARY_CLIENT,
        currency: SALARY_CURRENCY,
        targetToman: salaryToman,
        monthsAgo,
        tomanStep: 1_000_000,
        dayOffset: payday - 1 + randInt(-2, 2),
        note: SALARY_NOTE,
      })
    }

    for (const gigClient of pickDistinct(GIG_CLIENTS, pick(hasSalary ? GIGS_WITH_SALARY : GIGS_WITHOUT_SALARY))) {
      const gigStep = pick(GIG_STEPS)
      emit({
        client: gigClient,
        currency: pick(['TOMAN', 'TOMAN', 'USDT', 'USD'] as const),
        targetToman: roundToStep(rand(GIG_MIN_TOMAN, GIG_MAX_TOMAN), gigStep),
        monthsAgo,
        tomanStep: gigStep,
        dayOffset: randInt(0, 27),
        note: pick(GIG_NOTES),
      })
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
