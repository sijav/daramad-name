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
  // matches the card. A passport is not, its number is Latin, and a Persian
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

// Everything a reader of the certificate actually looks at: the direction it
// reads in, the numerals it is written in, and the figures. None of these fail
// loudly, a wrong one produces a finished-looking page that is simply not
// true, handed to someone with no way to check it.

const everyString = (model: Awaited<ReturnType<typeof build>>): string[] => [
  model.title,
  model.subtitle,
  model.issuer,
  model.serialLabel,
  model.serial,
  ...model.identity.flatMap((row) => [row.label, row.value]),
  ...model.summary.flatMap((row) => [row.label, row.value]),
  model.totalLabel,
  model.totalFigure,
  model.totalInWordsLabel,
  model.totalInWords,
  model.breakdownTitle,
  model.columns.month,
  model.columns.count,
  model.columns.amount,
  ...model.months.flatMap((row) => [row.month, row.count, row.amount]),
  model.averageBasis,
  model.footnote,
]

describe('the document is written in its OWN language, not the interface’s', () => {
  it('reads left to right in English and right to left in Persian', async () => {
    expect((await build('en')).direction).toBe('ltr')
    expect((await build('fa')).direction).toBe('rtl')
  })

  it('puts NOT ONE Persian numeral anywhere on the English certificate', async () => {
    // The failure this exists for: an embassy officer receiving «۶۴۴٬۲۶۰٬۰۰۰»
    // on an otherwise English page. It only takes one field to slip.
    const model = await build('en')

    for (const text of everyString(model)) {
      expect(text).not.toMatch(/[۰-۹]/)
    }
  })

  it('writes every figure in Persian numerals on the Persian certificate', async () => {
    const model = await build('fa')

    expect(model.totalFigure).toBe('۶۴۴٬۲۶۰٬۰۰۰ تومان')
    expect(model.months[0].count).toBe('۲')
    expect(model.months[0].amount).toBe('۴۴٬۰۰۰٬۰۰۰ تومان')
  })

  it('dates the English certificate in Gregorian even when the app is on the Jalali calendar', async () => {
    // The calendar setting is the interface's; an English document that dated
    // itself ۱۴۰۵ would be unreadable to the person it is for.
    const model = await build('en')
    const issuedOn = model.summary.find((row) => row.label === 'Issued on')?.value ?? ''

    expect(issuedOn).toMatch(/^\d{2} [A-Za-z]{3} \d{4}$/)
  })

  it('dates the Persian certificate in Jalali', async () => {
    const model = await build('fa')
    const issuedOn = model.summary.find((row) => row.label === 'تاریخ صدور')?.value ?? ''

    expect(issuedOn).toMatch(/^[۰-۹]+ \S+ ۱۴۰۵$/)
  })
})

// A reference that changed on every print would undermine the one thing it is
// there to signal: that this page and the one filed last week are the same
// document.
describe('the reference', () => {
  it('is identical for the same report printed twice on the same day', async () => {
    expect((await build('fa')).serial).toBe((await build('fa')).serial)
  })

  it('carries the Jalali year the document COVERS, not the Gregorian one', async () => {
    // The range ends in July 2026, which is 1405. Slicing the ISO string would
    // print 2026 beside dates that all read ۱۴۰۵.
    expect((await build('fa')).serial).toMatch(/^DN-1405-/)
  })

  it('changes when the total changes, so two different figures cannot share one reference', async () => {
    const i18n = await loadReportI18n('fa-IR')
    const first = buildCertificateModel(report(), 'fa', 'JALALI', i18n)
    const second = buildCertificateModel(report({ totalToman: 644_260_001 }), 'fa', 'JALALI', i18n)

    expect(second.serial).not.toBe(first.serial)
  })
})

describe('the total in words', () => {
  it('is written out and carries the unit, because words cannot be altered by adding a zero', async () => {
    const model = await build('fa')

    expect(model.totalInWords).toMatch(/^\S/)
    expect(model.totalInWords.endsWith('تومان')).toBe(true)
  })

  it('is left EMPTY rather than wrong when the amount runs past the named scales', async () => {
    // `numberToWords` gives up beyond «هزار میلیارد». The model must hand the
    // page an empty string so the row disappears, not a dangling «تومان» with
    // no figure in front of it.
    const i18n = await loadReportI18n('fa-IR')
    const model = buildCertificateModel(report({ totalToman: 1e18 }), 'fa', 'JALALI', i18n)

    expect(model.totalInWords).toBe('')
  })
})

describe('the average states its own divisor', () => {
  it('names the number of months it divided by, in the document’s numerals', async () => {
    // An average with an unstated basis is the number a clerk discards the
    // whole document over.
    expect((await build('fa')).averageBasis).toContain('۴')
    expect((await build('en')).averageBasis).toContain('4')
  })
})

describe('incomplete', () => {
  it('is true when the holder has no name, because the page is not presentable yet', async () => {
    expect((await build('en', { fullName: '', fullNameEn: '' })).incomplete).toBe(true)
  })

  it('is true for a name that is only whitespace', async () => {
    expect((await build('fa', { fullName: '   ' })).incomplete).toBe(true)
  })

  it('is false once a name is set', async () => {
    expect((await build('fa')).incomplete).toBe(false)
  })
})
