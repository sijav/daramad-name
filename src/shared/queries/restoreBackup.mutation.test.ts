import { db, defaultSettings, readSettings } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import type { BackupFile, Client, Receipt } from 'src/shared/types'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { restoreBackupMutation } from './restoreBackup.mutation'

// Restore replaces; it never merges. Merging would need a rule for "the same
// receipt" that does not exist, and restoring one file twice would silently
// double the user's income, the worst failure available to a tool whose entire
// value is an accurate total.
//
// The other half is that a file is checked BEFORE anything is deleted. Someone
// restoring a backup is usually already in trouble; a bad file must leave them
// exactly where they were rather than taking the data they still had.

const aria: Client = { id: 'aria', name: 'آریا', nameKey: 'آریا', createdAt: '2026-01-01T00:00:00.000Z' }

const receipt = (overrides: Partial<Receipt> & Pick<Receipt, 'id'>): Receipt => ({
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: 500,
  currency: 'USDT',
  rate: 98_500,
  amountToman: 49_250_000,
  clientId: 'aria',
  channel: 'TETHER',
  note: null,
  createdAt: '2026-05-10T12:00:00.000Z',
  updatedAt: '2026-05-10T12:00:00.000Z',
  ...overrides,
})

const backup = (overrides: Partial<BackupFile> = {}): BackupFile => ({
  app: 'daramadname',
  version: 1,
  exportedAt: '2026-07-22T09:00:00.000Z',
  receipts: [receipt({ id: 'r1' })],
  clients: [aria],
  settings: { ...defaultSettings, locale: 'en-US' },
  ...overrides,
})

/** Anything a hand-edited or foreign file can be, expressed as raw JSON. */
const restore = (value: unknown) => restoreBackupMutation({ json: JSON.stringify(value) })

const seedExistingData = async () => {
  await db.clients.add({ id: 'homa', name: 'هما', nameKey: 'هما', createdAt: '2026-01-01T00:00:00.000Z' })
  await db.receipts.add(receipt({ id: 'existing', clientId: 'homa' }))
}

beforeAll(async () => {
  await activateLocale('fa-IR')
})

describe('a good file', () => {
  it('replaces what is there rather than adding to it', async () => {
    await seedExistingData()

    await restore(backup())

    expect((await db.receipts.toArray()).map((row) => row.id)).toEqual(['r1'])
    expect((await db.clients.toArray()).map((row) => row.id)).toEqual(['aria'])
  })

  // Restoring the same file twice is a thing people do when they are not sure
  // it worked the first time.
  it('is idempotent, so restoring the same file twice does not double the income', async () => {
    await restore(backup())
    await restore(backup())

    expect(await db.receipts.count()).toBe(1)
    expect(await db.clients.count()).toBe(1)
  })

  it('restores the settings from the file, including the certificate identity', async () => {
    await restore(
      backup({ settings: { ...defaultSettings, calendar: 'GREGORIAN', profile: { ...defaultSettings.profile, fullName: 'رها' } } }),
    )

    const settings = await readSettings()
    expect(settings.calendar).toBe('GREGORIAN')
    expect(settings.profile.fullName).toBe('رها')
  })

  it('repairs a settings block from an older version instead of refusing the whole file', async () => {
    await restore({ ...backup(), settings: { calendar: 'GREGORIAN' } })

    const settings = await readSettings()
    expect(settings.calendar).toBe('GREGORIAN')
    expect(settings.locale).toBe(defaultSettings.locale)
    expect(settings.profile.fullName).toBe('')
  })

  it('accepts a file with no export stamp, dating it now', async () => {
    const { exportedAt: _dropped, ...withoutStamp } = backup()

    expect((await restore(withoutStamp)).exportedAt).toEqual(expect.any(String))
  })

  it('accepts an empty backup, which is what a brand-new user’s first file looks like', async () => {
    await seedExistingData()

    await restore(backup({ receipts: [], clients: [] }))

    expect(await db.receipts.count()).toBe(0)
  })
})

describe('a file that cannot be trusted', () => {
  beforeEach(seedExistingData)

  const expectDataUntouched = async () => {
    expect((await db.receipts.toArray()).map((row) => row.id)).toEqual(['existing'])
    expect((await db.clients.toArray()).map((row) => row.id)).toEqual(['homa'])
  }

  it('rejects something that is not JSON at all', async () => {
    await expect(restoreBackupMutation({ json: 'not a backup' })).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a JSON file that is not an object', async () => {
    await expect(restore(null)).rejects.toThrow()
    await expect(restore([1, 2, 3])).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a backup exported by some other tool', async () => {
    await expect(restore({ ...backup(), app: 'some-other-ledger' })).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a file from a newer version, rather than dropping the fields it does not know', async () => {
    await expect(restore({ ...backup(), version: 2 })).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a truncated file with no receipts or clients list', async () => {
    await expect(restore({ app: 'daramadname', version: 1 })).rejects.toThrow()
    await expectDataUntouched()
  })

  // The same checks the app uses on write and on export, so a file cannot be
  // refused from one direction and trusted from another.
  it('rejects a receipt whose stored toman value is gone', async () => {
    await expect(restore(backup({ receipts: [{ ...receipt({ id: 'r1' }), amountToman: Number.NaN }] }))).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a foreign-currency receipt with no frozen rate', async () => {
    await expect(restore(backup({ receipts: [receipt({ id: 'r1', rate: null })] }))).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a receipt pointing at a client the file does not contain', async () => {
    await expect(restore(backup({ receipts: [receipt({ id: 'r1', clientId: 'ghost' })] }))).rejects.toThrow()
    await expectDataUntouched()
  })

  it('rejects a nameless client', async () => {
    await expect(restore(backup({ clients: [{ ...aria, name: '  ' }] }))).rejects.toThrow()
    await expectDataUntouched()
  })

  it('leaves the settings alone too, not only the rows', async () => {
    await expect(restore({ ...backup(), app: 'elsewhere' })).rejects.toThrow()

    expect((await readSettings()).locale).toBe(defaultSettings.locale)
  })
})
