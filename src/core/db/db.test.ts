import type { CalendarSystem } from 'src/shared/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, defaultSettings, readSettings, upsertClientByName, writeSettings } from './db'

// The two places the database quietly rewrites what it was handed, and both
// have already produced live bugs.
//
// `readSettings` merges over the defaults: a row written before a field existed
// used to come back without it, and `Intl.NumberFormat(undefined)` fell through
// to the system locale, a Persian-reading user saw «649,980,000» where «۶۴۹٬۹۸۰٬۰۰۰»
// belonged, with nothing on screen to explain it.
//
// `upsertClientByName` folds free-text names together: «آریا» and «آریا » as two
// rows splits one client's income across the ledger, the donut and the filter
// dropdown, and every per-client figure is then wrong by an amount nobody can see.

beforeEach(() => {
  // `upsertClientByName` mints ids through `window.crypto`; the unit project
  // runs in node, which has the global but not the `window` wrapper the repo
  // routes browser globals through.
  vi.stubGlobal('window', { crypto: globalThis.crypto })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readSettings', () => {
  it('seeds the single row on first run, so no caller ever handles undefined', async () => {
    expect(await db.settings.count()).toBe(0)

    expect(await readSettings()).toEqual(defaultSettings)
    expect(await db.settings.count()).toBe(1)
  })

  it('returns what was written rather than re-seeding the defaults over it', async () => {
    await writeSettings({ ...defaultSettings, locale: 'en-US', calendar: 'GREGORIAN', themePreference: 'dark' })

    const settings = await readSettings()

    expect(settings.locale).toBe('en-US')
    expect(settings.calendar).toBe('GREGORIAN')
    expect(settings.themePreference).toBe('dark')
  })

  // This is the migration path. A row from a version that predates `locale` and
  // `themePreference` must come back with them filled in, not missing.
  it('fills fields a row from an older version does not have', async () => {
    interface LegacyRow {
      key: 'settings'
      calendar: CalendarSystem
    }
    await db.table<LegacyRow>('settings').put({ key: 'settings', calendar: 'GREGORIAN' })

    const settings = await readSettings()

    expect(settings.calendar).toBe('GREGORIAN')
    expect(settings.locale).toBe(defaultSettings.locale)
    expect(settings.themePreference).toBe(defaultSettings.themePreference)
  })

  // The profile gained fullNameEn, passportNumber and addressEn after the first
  // rows were written. They must arrive as empty strings, the Settings form
  // binds them to controlled inputs, and undefined makes React swap the field
  // to uncontrolled mid-session.
  it('fills the profile fields a row from an older version does not have, keeping the ones it does', async () => {
    interface LegacyRow {
      key: 'settings'
      profile: { fullName: string; nationalId: string }
    }
    await db.table<LegacyRow>('settings').put({ key: 'settings', profile: { fullName: 'رها موسوی', nationalId: '0012345678' } })

    const { profile } = await readSettings()

    expect(profile.fullName).toBe('رها موسوی')
    expect(profile.nationalId).toBe('0012345678')
    expect(profile.fullNameEn).toBe('')
    expect(profile.passportNumber).toBe('')
    expect(profile.addressEn).toBe('')
  })

  it('does not leak the storage key into the settings object', async () => {
    await writeSettings(defaultSettings)

    expect(await readSettings()).not.toHaveProperty('key')
  })
})

describe('writeSettings', () => {
  it('replaces the single row rather than accumulating one per save', async () => {
    await writeSettings({ ...defaultSettings, locale: 'en-US' })
    await writeSettings({ ...defaultSettings, locale: 'fa-IR' })

    expect(await db.settings.count()).toBe(1)
    expect((await readSettings()).locale).toBe('fa-IR')
  })
})

describe('upsertClientByName', () => {
  it('creates one client, trimmed, with a lowercased lookup key', async () => {
    const client = await upsertClientByName('  Aria Trading  ')

    expect(client?.name).toBe('Aria Trading')
    expect(client?.nameKey).toBe('aria trading')
    expect(await db.clients.count()).toBe(1)
  })

  it('folds «آریا » onto «آریا» instead of opening a second client', async () => {
    const first = await upsertClientByName('آریا')
    const second = await upsertClientByName('آریا ')

    expect(second?.id).toBe(first?.id)
    expect(await db.clients.count()).toBe(1)
  })

  it('matches an existing client whatever case it is typed in', async () => {
    const first = await upsertClientByName('Aria Trading')
    const second = await upsertClientByName('ARIA TRADING')

    expect(second?.id).toBe(first?.id)
    expect(await db.clients.count()).toBe(1)
  })

  // The first spelling is the one the user chose; a later entry in different
  // case must not rename the client under every row already showing it.
  it('keeps the spelling the client was created with', async () => {
    await upsertClientByName('Aria Trading')
    const second = await upsertClientByName('aria trading')

    expect(second?.name).toBe('Aria Trading')
  })

  it('returns null for a blank name, so the receipt stays unassigned rather than creating a nameless client', async () => {
    expect(await upsertClientByName('   ')).toBeNull()
    expect(await upsertClientByName('')).toBeNull()
    expect(await db.clients.count()).toBe(0)
  })
})
