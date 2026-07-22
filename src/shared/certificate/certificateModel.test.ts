import { loadReportI18n } from 'src/core/i18n'
import type { IncomeReport, Profile } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { buildCertificateModel } from './certificateModel'

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  fullName: 'سینا جواهری',
  fullNameEn: 'Sina Javaheri',
  nationalId: '۰۰۱۲۳۴۵۶۷۸',
  passportNumber: 'K12345678',
  phone: '۰۹۱۲۱۲۳۴۵۶۷',
  address: 'تهران، خیابان ولیعصر',
  addressEn: 'Valiasr St, Tehran',
  ...overrides,
})

const report = (overrides: Partial<IncomeReport> = {}): IncomeReport => ({
  profile: profile(),
  range: { from: '2026-03-21T00:00:00.000Z', to: '2026-07-22T00:00:00.000Z' },
  totalToman: 644_260_000,
  monthlyAverageToman: 161_065_000,
  monthsInRange: 4,
  months: [{ month: 1, year: 1405, totalToman: 44_000_000, receiptCount: 2 }],
  generatedAt: '2026-07-22T00:00:00.000Z',
  ...overrides,
})

const build = async (language: 'fa' | 'en', over: Partial<Profile> = {}) => {
  const i18n = await loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')
  return buildCertificateModel(report({ profile: profile(over) }), language, 'JALALI', i18n)
}

const labels = (model: Awaited<ReturnType<typeof build>>) => model.identity.map((row) => row.label)
const valueOf = (model: Awaited<ReturnType<typeof build>>, label: string) => model.identity.find((row) => row.label === label)?.value

// The identity block is the part of the document an official reads first, and
// the part most likely to be wrong in a way nobody notices until it is in
// someone else's hands.
describe('certificate identity block', () => {
  it('drops rows with no value rather than printing an empty label', async () => {
    const model = await build('en', { nationalId: '', phone: '', passportNumber: '' })

    expect(labels(model)).toEqual(['Full name', 'Address'])
    // Specifically: no bare "Phone" against blank space.
    expect(labels(model)).not.toContain('Phone')
  })

  it('uses the Latin name and address on the English certificate', async () => {
    const model = await build('en')

    expect(valueOf(model, 'Full name')).toBe('Sina Javaheri')
    expect(valueOf(model, 'Address')).toBe('Valiasr St, Tehran')
  })

  it('falls back to the Persian spelling when no Latin one was entered', async () => {
    const model = await build('en', { fullNameEn: '', addressEn: '' })

    expect(valueOf(model, 'Full name')).toBe('سینا جواهری')
    expect(valueOf(model, 'Address')).toBe('تهران، خیابان ولیعصر')
  })

  it('keeps the Persian name on the Persian certificate even when a Latin one exists', async () => {
    const model = await build('fa')

    expect(valueOf(model, 'نام و نام خانوادگی')).toBe('سینا جواهری')
  })

  // A national ID card is printed in Persian numerals, so rendering it that way
  // matches the card. A passport is not — its number is Latin, and a Persian
  // rendering would not match the document an official is holding.
  it('renders the passport number in Latin digits on BOTH certificates', async () => {
    const fa = await build('fa')
    const en = await build('en')

    expect(valueOf(fa, 'شماره‌ی پاسپورت')).toBe('K12345678')
    expect(valueOf(en, 'Passport number')).toBe('K12345678')
  })

  it('renders the national ID in the document’s own numerals', async () => {
    const fa = await build('fa')
    const en = await build('en')

    expect(valueOf(fa, 'کد ملی')).toBe('۰۰۱۲۳۴۵۶۷۸')
    expect(valueOf(en, 'National ID')).toBe('0012345678')
  })
})
