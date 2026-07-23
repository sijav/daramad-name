import { loadReportI18n } from 'src/core/i18n'
import { buildCertificateModel, type ReportLanguage } from 'src/shared/certificate'
import type { IncomeReport } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { buildIncomeReport } from './buildIncomeReport'

// The PDF is the one-click path, and its output is only ever inspected after it
// has been downloaded, which is exactly how it shipped printing English
// headings for a Persian document without anyone noticing. These assertions run
// against the layout definition rather than a rendered file, so a field that
// stops reaching the page fails here first.

const report: IncomeReport = {
  profile: {
    fullName: 'رها موسوی',
    fullNameEn: 'Raha Mousavi',
    nationalId: '۰۰۱۲۳۴۵۶۷۸',
    passportNumber: 'A98765432',
    phone: '',
    address: 'تهران، خیابان کریم‌خان',
    addressEn: 'Karimkhan St, Tehran',
  },
  range: { from: '2026-03-21T00:00:00.000Z', to: '2026-07-22T00:00:00.000Z' },
  totalToman: 644_260_000,
  monthlyAverageToman: 161_065_000,
  monthsInRange: 4,
  months: [
    { month: 1, year: 1405, totalToman: 44_000_000, receiptCount: 2 },
    { month: 2, year: 1405, totalToman: 0, receiptCount: 0 },
  ],
  generatedAt: '2026-07-22T00:00:00.000Z',
}

const build = async (language: ReportLanguage, overrides: Partial<IncomeReport> = {}) => {
  const i18n = await loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')
  const model = buildCertificateModel({ ...report, ...overrides }, language, 'JALALI', i18n)
  return { model, doc: buildIncomeReport(model) }
}

/** Every string anywhere in the layout, flattened. */
const textOf = (node: unknown): string[] => {
  if (typeof node === 'string') {
    return [node]
  }
  if (Array.isArray(node)) {
    return node.flatMap(textOf)
  }
  if (node && typeof node === 'object') {
    return Object.values(node as Record<string, unknown>).flatMap(textOf)
  }
  return []
}

const rowsBlocks = (doc: ReturnType<typeof buildIncomeReport>) => doc.blocks.filter((block) => block.type === 'rows')

describe('buildIncomeReport', () => {
  it('is A4 and names the embedded Persian font, not a default with no Arabic glyphs', async () => {
    const { doc } = await build('fa')

    expect(doc.pageSize).toBe('A4')
    expect(doc.font).toBe('Vazirmatn')
  })

  it('carries every figure the model holds', async () => {
    const { model, doc } = await build('fa')
    const text = textOf(doc.blocks)

    expect(text).toContain(model.title)
    expect(text).toContain(model.serial)
    expect(text).toContain(model.totalFigure)
    // The «به حروف» line, which is what makes the page read as an instrument.
    expect(text).toContain(model.totalInWords)
    // And the basis of the average, so the figure cannot be read as inflated.
    expect(text).toContain(model.averageBasis)
  })

  it('keeps months with no income as their own row', async () => {
    const { doc } = await build('fa')
    const text = textOf(doc.blocks)

    // Ordibehesht earned nothing and must still appear, dropping empty months
    // makes a patchy year look continuous.
    expect(text.some((value) => value.includes('اردیبهشت'))).toBe(true)
  })

  it('flips alignment with the document’s direction, not the interface’s', async () => {
    const fa = await build('fa')
    const en = await build('en')

    expect(fa.doc.direction).toBe('rtl')
    expect(fa.doc.align).toBe('right')
    expect(en.doc.direction).toBe('ltr')
    expect(en.doc.align).toBe('left')
  })

  it('titles the file metadata with the holder’s name', async () => {
    const { doc } = await build('en')

    expect(doc.author).toBe('Raha Mousavi')
  })

  // A framed identity section with no rows reads as an unfilled form. An
  // unfilled profile used to be the way to reach that state.
  it('omits the identity block entirely rather than emitting an empty one', async () => {
    const { model, doc } = await build('fa', {
      profile: { fullName: '', fullNameEn: '', nationalId: '', passportNumber: '', phone: '', address: '', addressEn: '' },
    })

    expect(model.identity).toHaveLength(0)
    // Only the summary rows block survives; the identity one is gone.
    expect(rowsBlocks(doc)).toHaveLength(1)
    expect(rowsBlocks(doc).every((block) => block.rows.length > 0)).toBe(true)
  })

  it('has both an identity and a summary block when the profile is filled', async () => {
    const { doc } = await build('fa')

    expect(rowsBlocks(doc)).toHaveLength(2)
  })

  it('never prints a label with no value beside it', async () => {
    const { model } = await build('fa')

    expect(model.identity.every((row) => row.value.trim().length > 0)).toBe(true)
    // The fixture has no phone, so no phone row should exist at all.
    expect(model.identity.some((row) => row.label.includes('تلفن'))).toBe(false)
  })
})
