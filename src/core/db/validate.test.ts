import { activateLocale } from 'src/core/i18n'
import type { Client, Receipt, Settings } from 'src/shared/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { defaultSettings } from './db'
import { assertReferencesResolve, assertValidClient, assertValidReceipt, coerceSettings } from './validate'

// These guards stand between a corrupt backup file and a silently wrong total.
// A backup is only ever opened when it is the last copy left, so a receipt that
// restores without its stored Toman value does not fail loudly, it quietly
// changes what the user believes they earned, and the certificate built from it
// carries that number to an embassy.
//
// Every case below is a shape a real file can actually take: a hand-edited
// JSON, a file from a future version, a partial write.

const WHERE = 'this backup file'

const receipt = (overrides: Partial<Receipt> = {}): Receipt => ({
  id: 'r1',
  occurredAt: '2026-07-01T00:00:00.000Z',
  amountOriginal: 500,
  currency: 'USDT',
  rate: 98500,
  amountToman: 49_250_000,
  clientId: 'c1',
  channel: 'TETHER',
  note: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
})

const client = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  name: 'Aria Trading',
  nameKey: 'aria trading',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

// The validators throw localized messages, so a locale has to be active or
// Lingui throws its own error instead of the one under test.
beforeAll(async () => {
  await activateLocale('fa-IR')
})

describe('assertValidReceipt', () => {
  it('accepts a well-formed receipt', () => {
    expect(() => assertValidReceipt(receipt(), WHERE)).not.toThrow()
  })

  it('rejects a missing identifier', () => {
    expect(() => assertValidReceipt(receipt({ id: '' }), WHERE)).toThrow()
  })

  it('rejects an unparseable date', () => {
    expect(() => assertValidReceipt(receipt({ occurredAt: 'last Tuesday' }), WHERE)).toThrow()
  })

  it('rejects a non-numeric amount', () => {
    expect(() => assertValidReceipt({ ...receipt(), amountOriginal: '500' }, WHERE)).toThrow()
  })

  it('rejects NaN, which JSON.parse can produce from a hand-edited file', () => {
    expect(() => assertValidReceipt(receipt({ amountOriginal: Number.NaN }), WHERE)).toThrow()
  })

  it('rejects a currency this version does not know', () => {
    expect(() => assertValidReceipt({ ...receipt(), currency: 'EUR' }, WHERE)).toThrow()
  })

  it('rejects an unknown payment channel', () => {
    expect(() => assertValidReceipt({ ...receipt(), channel: 'PAYPAL' }, WHERE)).toThrow()
  })

  // The freeze is the product's central promise. A foreign-currency receipt
  // with no rate cannot be re-derived later, the rate that applied on the day
  // is gone.
  it('rejects a foreign-currency receipt with no stored rate', () => {
    expect(() => assertValidReceipt(receipt({ rate: null }), WHERE)).toThrow()
  })

  it('accepts a Toman receipt with no rate, because none is needed', () => {
    expect(() => assertValidReceipt(receipt({ currency: 'TOMAN', rate: null, amountToman: 500 }), WHERE)).not.toThrow()
  })

  it('rejects a receipt with no stored Toman value, which would corrupt every total', () => {
    expect(() => assertValidReceipt({ ...receipt(), amountToman: undefined }, WHERE)).toThrow()
  })

  it('rejects a value that is not an object at all', () => {
    expect(() => assertValidReceipt(null, WHERE)).toThrow()
    expect(() => assertValidReceipt('receipt', WHERE)).toThrow()
  })

  it('names the file in the message, so the user knows which one to replace', () => {
    expect(() => assertValidReceipt(receipt({ id: '' }), WHERE)).toThrow(new RegExp(WHERE))
  })
})

describe('assertValidClient', () => {
  it('accepts a well-formed client', () => {
    expect(() => assertValidClient(client(), WHERE)).not.toThrow()
  })

  it('rejects a missing identifier', () => {
    expect(() => assertValidClient(client({ id: '' }), WHERE)).toThrow()
  })

  it('rejects a blank name', () => {
    expect(() => assertValidClient(client({ name: '   ' }), WHERE)).toThrow()
  })
})

describe('assertReferencesResolve', () => {
  it('accepts a receipt pointing at a client in the same file', () => {
    expect(() => assertReferencesResolve([receipt()], [client()], WHERE)).not.toThrow()
  })

  it('accepts an unassigned receipt', () => {
    expect(() => assertReferencesResolve([receipt({ clientId: null })], [], WHERE)).not.toThrow()
  })

  // A dangling reference restores rows that render as «, » and vanish from every
  // per-client total, which is scenario 2's entire question.
  it('rejects a receipt pointing at a client the file does not contain', () => {
    expect(() => assertReferencesResolve([receipt({ clientId: 'ghost' })], [client()], WHERE)).toThrow()
  })
})

describe('coerceSettings', () => {
  it('fills fields a backup from an older version does not have', () => {
    const restored = coerceSettings({ calendar: 'GREGORIAN' } as Partial<Settings>, defaultSettings)

    expect(restored.calendar).toBe('GREGORIAN')
    expect(restored.locale).toBe(defaultSettings.locale)
    // The profile gained fullNameEn, passportNumber and addressEn after the
    // first backups were written; they must arrive empty, never undefined.
    expect(restored.profile.fullNameEn).toBe('')
    expect(restored.profile.passportNumber).toBe('')
    expect(restored.profile.addressEn).toBe('')
  })

  it('keeps a stored profile while still filling its gaps', () => {
    const restored = coerceSettings({ profile: { fullName: 'رها موسوی' } } as Partial<Settings>, defaultSettings)

    expect(restored.profile.fullName).toBe('رها موسوی')
    expect(restored.profile.addressEn).toBe('')
  })

  it('repairs rather than rejects, because a bad preference is not worth losing data over', () => {
    expect(() => coerceSettings(undefined, defaultSettings)).not.toThrow()
    expect(coerceSettings(undefined, defaultSettings)).toEqual(defaultSettings)
  })
})
