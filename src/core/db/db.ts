import Dexie, { type EntityTable } from 'dexie'
import type { Client, Receipt, Settings } from 'src/shared/types'

// IndexedDB is the whole persistence layer. There is no server: the brief
// mandates local-first data, and the footer promises nothing ever leaves the
// browser. JSON backup/restore is the substitute for sync.
//
// IndexedDB rather than localStorage because the ledger is unbounded, we need
// indexed range queries on `occurredAt`, and localStorage's ~5MB string cap
// would eventually silently truncate someone's financial history.

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
  // Persian by default — the product is for Iranian freelancers. English is
  // opt-in from Settings and persists across reloads.
  locale: 'fa-IR',
  profile: { fullName: '', nationalId: '', phone: '', address: '' },
}

/** Reads settings, seeding the single row on first run so callers never handle undefined. */
export const readSettings = async (): Promise<Settings> => {
  const row = await db.settings.get('settings')
  if (row) {
    const { key: _key, ...settings } = row
    return settings
  }
  await db.settings.put({ key: 'settings', ...defaultSettings })
  return defaultSettings
}

export const writeSettings = async (settings: Settings): Promise<Settings> => {
  await db.settings.put({ key: 'settings', ...settings })
  return settings
}

/**
 * Finds a client by name (case-insensitive) or creates one. Free-text entry in
 * the quick-record form must not produce «آریا» and «آریا » as two clients —
 * that would silently split a client's totals across the ledger and charts.
 */
export const upsertClientByName = async (name: string): Promise<Client | null> => {
  const trimmed = name.trim()
  if (!trimmed) {
    return null
  }
  const nameKey = trimmed.toLowerCase()
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
