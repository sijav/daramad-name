import { msg } from '@lingui/core/macro'
import { i18n } from 'src/core/i18n'
import {
  APP_LOCALES,
  CALENDAR_SYSTEMS,
  CHANNELS,
  CURRENCIES,
  THEME_PREFERENCES,
  type Client,
  type Receipt,
  type Settings,
} from 'src/shared/types'

/**
 * The one place a receipt, client or settings row is checked before it is
 * written, exported or restored.
 *
 * Every persistence path funnels through here, so a corrupt row cannot enter
 * from one direction and be trusted from another. The checks are about
 * invariants rather than types: a receipt with no `amountToman` type-checks
 * fine and then contributes zero to every total.
 *
 * Errors name the record and what is wrong with it. The user is the only one
 * who can decide whether to repair the file or abandon it.
 */

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isIsoInstant = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))

/**
 * Throws if the receipt could not be rendered or totalled correctly.
 *
 * A plain throwing check rather than an `asserts` signature: assertion
 * functions lose their narrowing when re-exported through a barrel, and
 * everything here is imported through one.
 */
export const assertValidReceipt = (receipt: unknown, where: string): void => {
  const r = receipt as Partial<Receipt>

  if (typeof r?.id !== 'string' || r.id === '') {
    throw new Error(i18n._(msg`A receipt in ${where} has no identifier.`))
  }
  if (!isIsoInstant(r.occurredAt)) {
    throw new Error(i18n._(msg`A receipt in ${where} has an unreadable date.`))
  }
  if (!isFiniteNumber(r.amountOriginal) || r.amountOriginal < 0) {
    throw new Error(i18n._(msg`A receipt in ${where} has an invalid amount.`))
  }
  if (r.currency === undefined || !CURRENCIES.includes(r.currency)) {
    throw new Error(i18n._(msg`A receipt in ${where} uses a currency this app does not know.`))
  }
  if (r.channel === undefined || !CHANNELS.includes(r.channel)) {
    throw new Error(i18n._(msg`A receipt in ${where} uses a payment channel this app does not know.`))
  }
  // The Toman figure is frozen on write and never recomputed, so a foreign
  // receipt without its rate can never be reconciled again.
  if (r.currency !== 'TOMAN' && (!isFiniteNumber(r.rate) || r.rate <= 0)) {
    throw new Error(i18n._(msg`A receipt in ${where} is in a foreign currency but has no stored conversion rate.`))
  }
  if (!isFiniteNumber(r.amountToman) || r.amountToman < 0) {
    throw new Error(i18n._(msg`A receipt in ${where} has no stored Toman value, so totals would be wrong.`))
  }
}

/** Throws if the client could not be shown or linked to its receipts. */
export const assertValidClient = (client: unknown, where: string): void => {
  const c = client as Partial<Client>

  if (typeof c?.id !== 'string' || c.id === '') {
    throw new Error(i18n._(msg`A client in ${where} has no identifier.`))
  }
  if (typeof c.name !== 'string' || c.name.trim() === '') {
    throw new Error(i18n._(msg`A client in ${where} has no name.`))
  }
}

/**
 * Receipts must not point at clients that are not in the same file, or the
 * ledger renders rows with no client and the share chart loses income.
 */
export const assertReferencesResolve = (receipts: Receipt[], clients: Client[], where: string): void => {
  const known = new Set(clients.map((client) => client.id))
  const orphan = receipts.find((receipt) => receipt.clientId !== null && !known.has(receipt.clientId))
  if (orphan) {
    throw new Error(i18n._(msg`A receipt in ${where} refers to a client that is not in the file.`))
  }
}

const oneOf = <T>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)

/**
 * Settings are repaired rather than rejected. A bad preference is not worth
 * losing a ledger over.
 *
 * Each VALUE is checked, not just each key. A spread alone lets a
 * present-but-unknown value win over the fallback, and an unknown value does
 * more damage than a missing one: an unrecognised `calendar` falls through
 * every `calendar === 'JALALI' ? … : …` in `dates.ts` and renders the ledger in
 * the other calendar, and an unrecognised `locale` makes the catalog import
 * reject, leaving the app on its opening spinner.
 */
export const coerceSettings = (settings: Partial<Settings> | undefined, fallback: Settings): Settings => ({
  ...fallback,
  ...settings,
  calendar: oneOf(settings?.calendar, CALENDAR_SYSTEMS, fallback.calendar),
  locale: oneOf(settings?.locale, APP_LOCALES, fallback.locale),
  themePreference: oneOf(settings?.themePreference, THEME_PREFERENCES, fallback.themePreference),
  profile: { ...fallback.profile, ...settings?.profile },
})
