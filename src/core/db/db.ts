import Dexie, { type EntityTable } from 'dexie'
import type { Client, Receipt, Settings } from 'src/shared/types'
import { toPersianLetters } from 'src/shared/utils'

// IndexedDB rather than localStorage: the ledger is unbounded, every query
// filters by date range, and localStorage caps at about 5MB of string with no
// error when it fills.

/** Single-row table; `key` is always `'settings'`. */
interface SettingsRow extends Settings {
  key: 'settings'
}

class DaramadnameDb extends Dexie {
  receipts!: EntityTable<Receipt, 'id'>
  clients!: EntityTable<Client, 'id'>
  settings!: EntityTable<SettingsRow, 'key'>

  constructor() {
    super('daramadname')
    // `occurredAt` is indexed because every ledger query, chart and report
    // filters by date range. `nameKey` is indexed for case-insensitive
    // client lookup on free-text entry.
    this.version(1).stores({
      receipts: 'id, occurredAt, clientId, channel, currency',
      clients: 'id, &nameKey, name',
      settings: 'key',
    })
  }
}

export const db = new DaramadnameDb()

export const defaultSettings: Settings = {
  calendar: 'JALALI',
  // Persian by default, the product is for Iranian freelancers. English is
  // opt-in from Settings and persists across reloads.
  locale: 'fa-IR',
  // Following the OS is the least surprising default; the user can pin it.
  themePreference: 'system',
  profile: { fullName: '', fullNameEn: '', nationalId: '', passportNumber: '', phone: '', address: '', addressEn: '' },
}

/**
 * Reads settings, seeding the row on first run so callers never handle
 * undefined.
 *
 * The stored row is merged over the defaults rather than returned as-is, which
 * makes every setting added later self-migrating. A row written before `locale`
 * existed would otherwise hand `undefined` to `Intl.NumberFormat`, which falls
 * back to the system locale without complaining.
 */
export const readSettings = async (): Promise<Settings> => {
  const row = await db.settings.get('settings')
  if (row) {
    const { key: _key, ...stored } = row
    return { ...defaultSettings, ...stored, profile: { ...defaultSettings.profile, ...stored.profile } }
  }
  await db.settings.put({ key: 'settings', ...defaultSettings })
  // A copy, not the module constant: callers treat this as their own object,
  // and one of them mutating it would change the defaults for the session.
  return { ...defaultSettings, profile: { ...defaultSettings.profile } }
}

export const writeSettings = async (settings: Settings): Promise<Settings> => {
  await db.settings.put({ key: 'settings', ...settings })
  return settings
}

/**
 * Finds a client by name or creates one.
 *
 * The key is trimmed, lowercased and folded to Persian letterforms, so three
 * ways of typing the same name reach the same row: trailing space, casing, and
 * the Arabic ك/ي an Arabic keyboard produces where an Iranian one produces
 * ک/ی. Two rows for one client would split their income across the ledger and
 * halve their share in the concentration insight.
 */
export const upsertClientByName = async (name: string): Promise<Client | null> => {
  const trimmed = name.trim()
  if (!trimmed) {
    return null
  }
  const nameKey = toPersianLetters(trimmed).toLowerCase()
  const existing = await db.clients.where('nameKey').equals(nameKey).first()
  if (existing) {
    return existing
  }
  const client: Client = {
    id: window.crypto.randomUUID(),
    name: trimmed,
    nameKey,
    createdAt: new Date().toISOString(),
  }
  await db.clients.add(client)
  return client
}
