import { msg } from '@lingui/core/macro'
import { i18n } from 'src/core/i18n'
import { CHANNELS, CURRENCIES, type Client, type Receipt, type Settings } from 'src/shared/types'

/**
 * The one place a receipt, client or settings row is checked before it is
 * written, exported or restored.
 *
 * Every persistence path funnels through here so a corrupt row cannot enter the
 * database from one direction and then be trusted from another. The checks are
 * about the invariants the whole app leans on rather than about types: a
 * receipt missing `amountToman` type-checks fine and then contributes zero to
 * every total silently, which is the failure mode this exists to prevent.
 *
 * Errors are phrased for a person, per rule 9 — they say which record and what
 * is wrong with it, because the user is the only one who can decide whether to
 * fix the file or abandon it.
 */

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isIsoInstant = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))

/** Throws if the receipt could not be rendered or totalled correctly. */
// Plain throwing checks rather than `asserts` signatures: an assertion
// function loses its narrowing when re-exported through a barrel, and the
// repo imports everything through barrels.
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
  // The frozen conversion is the app's core promise; a missing or zero rate on a
  // foreign-currency receipt means the Toman figure can never be trusted again.
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

/** Settings are repaired rather than rejected — a bad preference is not worth losing data over. */
export const coerceSettings = (settings: Partial<Settings> | undefined, fallback: Settings): Settings => ({
  ...fallback,
  ...settings,
  profile: { ...fallback.profile, ...settings?.profile },
})
