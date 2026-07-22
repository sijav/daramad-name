import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import { loadReportI18n } from 'src/core/i18n'
import { buildCertificateModel } from 'src/shared/certificate'
import type { IncomeReport } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { fontkit, installBidiLayout } from './bidiText'
import { buildIncomeReport } from './buildIncomeReport'
import { type PdfDocumentConstructor, renderCertificatePdf } from './renderCertificatePdf'

// @types/pdfkit types the default export as an instance; at runtime it is the constructor.
const PdfCtor = PDFDocument as unknown as PdfDocumentConstructor

// The full one-click pipeline, end to end, in Node: model -> layout -> pdfkit.
// It cannot render a page in a terminal, but it CAN prove the file is a real,
// font-embedded, selectable PDF that the browser path also produces — the parts
// that would silently ship a broken download if they regressed.

const fontUrl = (name: string) => fileURLToPath(new URL(`../../../node_modules/vazirmatn/fonts/ttf/${name}`, import.meta.url))
const regular = readFileSync(fontUrl('Vazirmatn-Regular.ttf'))
const bold = readFileSync(fontUrl('Vazirmatn-Bold.ttf'))
installBidiLayout(fontkit.create(regular))

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

const render = async (language: 'fa' | 'en') => {
  const i18n = await loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')
  const model = buildCertificateModel(report, language, 'JALALI', i18n)
  const blob = await renderCertificatePdf(PdfCtor, { regular, bold }, buildIncomeReport(model))
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return { blob, bytes, raw: new TextDecoder('latin1').decode(bytes) }
}

describe('renderCertificatePdf', () => {
  it('produces a well-formed PDF blob', async () => {
    const { blob, raw } = await render('fa')

    expect(blob.type).toBe('application/pdf')
    expect(raw.startsWith('%PDF-')).toBe(true)
    expect(raw).toContain('%%EOF')
  })

  it('embeds the Vazirmatn font so Persian is not empty boxes', async () => {
    const { raw } = await render('fa')

    expect(raw).toContain('FontFile2')
    expect(raw).toMatch(/Vazirmatn/)
  })

  it('carries a ToUnicode map so the text is selectable, not a picture', async () => {
    const { raw } = await render('fa')

    expect(raw).toContain('ToUnicode')
  })

  it('renders both the Persian and the English certificate without throwing', async () => {
    const fa = await render('fa')
    const en = await render('en')

    // A certificate is a page of type; a few KB would mean it drew nothing.
    expect(fa.bytes.length).toBeGreaterThan(20_000)
    expect(en.bytes.length).toBeGreaterThan(20_000)
  })
})
