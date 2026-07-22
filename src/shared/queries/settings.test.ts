import { db, defaultSettings, readSettings, writeSettings } from 'src/core/db'
import type { Profile, Receipt } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { clearAllDataMutation } from './clearAllData.mutation'
import { getSettingsQuery } from './getSettings.query'
import { setCalendarMutation } from './setCalendar.mutation'
import { setLocaleMutation } from './setLocale.mutation'
import { setThemePreferenceMutation } from './setThemePreference.mutation'
import { updateProfileMutation } from './updateProfile.mutation'

// Four mutations write to one row. Each reads the row first and puts back a
// copy with one field changed, which means any of them could quietly drop the
// others. The profile is the expensive one to lose: there is no login, so it is
// the only source for the name and national ID printed on the certificate, and
// nothing on screen would say it had gone until the PDF came out anonymous.

const profile: Profile = {
  fullName: 'رها موسوی',
  fullNameEn: 'Raha Mousavi',
  nationalId: '0012345678',
  passportNumber: 'K12345678',
  phone: '09121234567',
  address: 'تهران، خیابان ولیعصر',
  addressEn: 'Valiasr St, Tehran',
}

const receipt = (id: string): Receipt => ({
  id,
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: 1_000_000,
  currency: 'TOMAN',
  rate: null,
  amountToman: 1_000_000,
  clientId: null,
  channel: 'CARD_TO_CARD',
  note: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('getSettingsQuery', () => {
  it('hands a first-run user the defaults rather than undefined', async () => {
    expect(await getSettingsQuery()).toEqual(defaultSettings)
  })

  it('reads back what was saved, so the choice survives a reload', async () => {
    await setLocaleMutation({ locale: 'en-US' })

    expect((await getSettingsQuery()).locale).toBe('en-US')
  })
})

describe('the settings writers keep each other’s fields', () => {
  it('changing the calendar leaves the locale, theme and profile alone', async () => {
    await updateProfileMutation(profile)
    await setLocaleMutation({ locale: 'en-US' })
    await setThemePreferenceMutation({ themePreference: 'dark' })

    const settings = await setCalendarMutation({ calendar: 'GREGORIAN' })

    expect(settings.calendar).toBe('GREGORIAN')
    expect(settings.locale).toBe('en-US')
    expect(settings.themePreference).toBe('dark')
    expect(settings.profile.fullName).toBe('رها موسوی')
  })

  it('changing the language does not wipe the certificate identity', async () => {
    await updateProfileMutation(profile)

    const settings = await setLocaleMutation({ locale: 'en-US' })

    expect(settings.profile).toEqual(profile)
  })

  it('changing the colour scheme does not touch the calendar', async () => {
    await setCalendarMutation({ calendar: 'GREGORIAN' })

    expect((await setThemePreferenceMutation({ themePreference: 'light' })).calendar).toBe('GREGORIAN')
  })

  it('saving the profile does not reset the language back to Persian', async () => {
    await setLocaleMutation({ locale: 'en-US' })

    await updateProfileMutation(profile)

    expect((await readSettings()).locale).toBe('en-US')
  })

  it('every writer persists, rather than only returning the new value', async () => {
    await setCalendarMutation({ calendar: 'GREGORIAN' })
    await setLocaleMutation({ locale: 'en-US' })
    await setThemePreferenceMutation({ themePreference: 'dark' })
    await updateProfileMutation(profile)

    expect(await readSettings()).toEqual({ calendar: 'GREGORIAN', locale: 'en-US', themePreference: 'dark', profile })
  })

  it('keeps one settings row however many times they are called', async () => {
    await setCalendarMutation({ calendar: 'GREGORIAN' })
    await setLocaleMutation({ locale: 'en-US' })
    await updateProfileMutation(profile)

    expect(await db.settings.count()).toBe(1)
  })
})

describe('updateProfileMutation', () => {
  it('returns the saved profile, so the form can show what actually landed', async () => {
    expect(await updateProfileMutation(profile)).toEqual(profile)
  })

  it('replaces the profile wholesale, so a cleared field really is cleared', async () => {
    await updateProfileMutation(profile)

    const saved = await updateProfileMutation({ ...profile, passportNumber: '' })

    expect(saved.passportNumber).toBe('')
  })
})

// The "erase everything" button. What matters is that it leaves nothing behind
// — a stale profile surviving a wipe would print the previous owner's name and
// national ID on the next certificate this browser produces.
describe('clearAllDataMutation', () => {
  it('removes every receipt and client and resets the settings', async () => {
    await db.receipts.bulkAdd([receipt('r1'), receipt('r2')])
    await db.clients.add({ id: 'aria', name: 'آریا', nameKey: 'آریا', createdAt: '2026-01-01T00:00:00.000Z' })
    await writeSettings({ ...defaultSettings, locale: 'en-US', profile })

    await clearAllDataMutation()

    expect(await db.receipts.count()).toBe(0)
    expect(await db.clients.count()).toBe(0)
    expect(await readSettings()).toEqual(defaultSettings)
  })

  it('is safe to run on an already-empty database', async () => {
    await expect(clearAllDataMutation()).resolves.toBe(true)
    expect(await readSettings()).toEqual(defaultSettings)
  })
})
