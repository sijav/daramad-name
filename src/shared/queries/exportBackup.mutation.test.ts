import { db, defaultSettings, readSettings, writeSettings } from 'src/core/db'
import { activateLocale } from 'src/core/i18n'
import type { BackupFile, Client, Receipt } from 'src/shared/types'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportBackupMutation } from './exportBackup.mutation'
import { restoreBackupMutation } from './restoreBackup.mutation'

// The backup file is the only copy of this data that is not in one browser
// profile, and scenario 6 — "move to another device" — is nothing but this file
// carried by hand. Two things therefore matter more than the download working:
// the file must refuse to be written from data that is already broken, because
// a corrupt backup gets trusted and is only opened when it is the last copy
// left; and everything in it must come back.

const receipt = (overrides: Partial<Receipt> & Pick<Receipt, 'id'>): Receipt => ({
  occurredAt: '2026-05-10T12:00:00.000Z',
  amountOriginal: 500,
  currency: 'USDT',
  rate: 98_500,
  amountToman: 49_250_000,
  clientId: 'aria',
  channel: 'TETHER',
  note: 'قسط اول',
  createdAt: '2026-05-10T12:00:00.000Z',
  updatedAt: '2026-05-11T08:00:00.000Z',
  ...overrides,
})

const aria: Client = { id: 'aria', name: 'آریا', nameKey: 'آریا', createdAt: '2026-01-01T00:00:00.000Z' }

let savedBlobs: Blob[] = []
let downloads: { href: string; download: string }[] = []

const stubDownloadPath = () => {
  savedBlobs = []
  downloads = []
  vi.stubGlobal('window', {
    crypto: globalThis.crypto,
    Blob: globalThis.Blob,
    URL: {
      createObjectURL: (blob: Blob) => {
        savedBlobs.push(blob)
        return 'blob:daramadname'
      },
      revokeObjectURL: () => undefined,
    },
    document: {
      createElement: () => {
        const anchor = { href: '', download: '', click: () => downloads.push({ href: anchor.href, download: anchor.download }) }
        return anchor
      },
    },
  })
}

beforeAll(async () => {
  await activateLocale('fa-IR')
})

beforeEach(stubDownloadPath)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('exportBackupMutation', () => {
  it('writes every receipt, client and the settings row into the downloaded file', async () => {
    await db.clients.add(aria)
    await db.receipts.bulkAdd([receipt({ id: 'r1' }), receipt({ id: 'r2', amountToman: 1_000_000, currency: 'TOMAN', rate: null })])
    await writeSettings({ ...defaultSettings, locale: 'en-US', profile: { ...defaultSettings.profile, fullName: 'رها موسوی' } })

    await exportBackupMutation()

    const file = JSON.parse(await savedBlobs[0].text()) as BackupFile
    expect(file.app).toBe('daramadname')
    expect(file.version).toBe(1)
    expect(file.receipts.map((row) => row.id).sort()).toEqual(['r1', 'r2'])
    expect(file.clients).toEqual([aria])
    expect(file.settings.locale).toBe('en-US')
    expect(file.settings.profile.fullName).toBe('رها موسوی')
  })

  it('names the file after the day it was exported', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-07-22T09:00:00.000Z'))

    await exportBackupMutation()

    expect(downloads[0].download).toBe('daramadname-backup-2026-07-22.json')
  })

  // The important half is the second assertion: nothing was downloaded. A file
  // that opens and looks complete but totals wrong is worse than no file.
  it('refuses to write a file from a receipt with a broken toman value, and downloads nothing', async () => {
    await db.receipts.add(receipt({ id: 'r1', amountToman: Number.NaN }))

    await expect(exportBackupMutation()).rejects.toThrow()

    expect(downloads).toHaveLength(0)
    expect(savedBlobs).toHaveLength(0)
  })

  it('refuses to write a file from a foreign-currency receipt whose rate was lost', async () => {
    await db.clients.add(aria)
    await db.receipts.add(receipt({ id: 'r1', rate: null }))

    await expect(exportBackupMutation()).rejects.toThrow()
    expect(downloads).toHaveLength(0)
  })

  it('refuses to write a file whose receipts point at a client it does not contain', async () => {
    await db.receipts.add(receipt({ id: 'r1', clientId: 'never-added' }))

    await expect(exportBackupMutation()).rejects.toThrow()
    expect(downloads).toHaveLength(0)
  })

  it('refuses to write a file containing a nameless client', async () => {
    await db.clients.add({ ...aria, name: '   ' })

    await expect(exportBackupMutation()).rejects.toThrow()
    expect(downloads).toHaveLength(0)
  })

  it('exports an empty database without complaining, so a new user can still take a backup', async () => {
    const backup = await exportBackupMutation()

    expect(backup.receipts).toEqual([])
    expect(backup.clients).toEqual([])
    expect(downloads).toHaveLength(1)
  })
})

// Scenario 6 end to end, in the only form it has: a file written on one device
// and opened on another.
describe('the round trip through restore', () => {
  it('brings every field of every row back exactly as it left', async () => {
    await db.clients.add(aria)
    await db.receipts.bulkAdd([
      receipt({ id: 'r1' }),
      receipt({ id: 'r2', currency: 'TOMAN', rate: null, amountOriginal: 18_000_000, amountToman: 18_000_000, clientId: null, note: null }),
    ])
    await writeSettings({
      ...defaultSettings,
      calendar: 'GREGORIAN',
      locale: 'en-US',
      profile: { ...defaultSettings.profile, phone: '0912' },
    })
    const before = { receipts: await db.receipts.toArray(), clients: await db.clients.toArray(), settings: await readSettings() }

    await exportBackupMutation()
    const json = await savedBlobs[0].text()

    // The other device: a browser that has never seen this data.
    await Promise.all([db.receipts.clear(), db.clients.clear(), db.settings.clear()])
    await restoreBackupMutation({ json })

    expect(await db.receipts.orderBy('id').toArray()).toEqual(before.receipts.sort((left, right) => left.id.localeCompare(right.id)))
    expect(await db.clients.toArray()).toEqual(before.clients)
    expect(await readSettings()).toEqual(before.settings)
  })

  // The frozen rates are the part a JSON round trip could plausibly lose, and
  // losing them is unrecoverable: the rate that applied on the day is gone.
  it('keeps each receipt’s own frozen rate rather than re-deriving anything', async () => {
    await db.clients.add(aria)
    await db.receipts.bulkAdd([
      receipt({ id: 'old', rate: 84_600, amountOriginal: 950, amountToman: 80_370_000 }),
      receipt({ id: 'new', rate: 140_000, amountOriginal: 950, amountToman: 133_000_000 }),
    ])

    await exportBackupMutation()
    await db.receipts.clear()
    await restoreBackupMutation({ json: await savedBlobs[0].text() })

    expect((await db.receipts.get('old'))?.amountToman).toBe(80_370_000)
    expect((await db.receipts.get('new'))?.amountToman).toBe(133_000_000)
  })
})
