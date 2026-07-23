import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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

/**
 * A certificate that does not fit on one sheet: twelve month rows — the most
 * `getIncomeReportQuery` can bucket — under the kind of Persian postal address
 * people actually type, with the district, the landmark and the PO box in it.
 *
 * This is the shape that used to run off the bottom of page one and keep
 * drawing at coordinates below the paper: in the file, rendered by nothing.
 */
const fullYear: IncomeReport = {
  ...report,
  range: { from: '2026-03-21T00:00:00.000Z', to: '2027-03-20T00:00:00.000Z' },
  profile: {
    ...report.profile,
    address:
      'تهران، منطقه ۳، خیابان شهید دکتر بهشتی، خیابان سرافراز، نبش کوچه چهارم شرقی، روبه‌روی بانک ملی شعبه‌ی مرکزی، مجتمع اداری نگین، بلوک ب، طبقه‌ی هفتم، واحد ۷۰۳، کد پستی ۱۵۳۳۶۷۸۹۱۲، صندوق پستی ۱۹۳۹۵-۴۶۷۸',
    addressEn:
      'Unit 703, Block B, 7th Floor, Negin Office Complex, Corner of 4th East Alley, Opposite Bank Melli Central Branch, Sarafraz St, Shahid Beheshti St, District 3, Tehran 1533678912, PO Box 19395-4678, Iran',
  },
  monthsInRange: 12,
  months: Array.from({ length: 12 }, (_unused, index) => ({
    month: index + 1,
    year: 1405,
    totalToman: 40_000_000 + index * 3_000_000,
    receiptCount: (index % 4) + 1,
  })),
}

/** pdfkit writes one `/Type /Page` object per sheet, and `/Type /Pages` for the tree. */
const pageCount = (raw: string): number => (raw.match(/\/Type \/Page\b/g) ?? []).length

const render = async (language: 'fa' | 'en', source: IncomeReport = report) => {
  const i18n = await loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')
  const model = buildCertificateModel(source, language, 'JALALI', i18n)
  const blob = await renderCertificatePdf(PdfCtor, { regular, bold }, buildIncomeReport(model))
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return { blob, bytes, raw: new TextDecoder('latin1').decode(bytes) }
}

/**
 * Records every string pdfkit lays out, in order.
 *
 * pdfkit measures and draws ONE WORD at a time and places them left to right in
 * the order it receives them — so this sequence IS the visual order on the page.
 * For a right-to-left line that must be the REVERSE of the logical word order.
 * Getting this wrong is invisible to every other assertion here: the file is
 * still a valid, font-embedded, selectable PDF, it just reads backwards.
 */
const recordDrawnWords = async (language: 'fa' | 'en', source: IncomeReport = report) => {
  // Instrument the fontkit pdfkit itself uses. This file imports fontkit as ESM
  // while pdfkit `require`s the CommonJS build, and in Node those are two
  // different copies of the Font class — instrumenting ours would record
  // nothing.
  const cjsFontkit = createRequire(import.meta.url)('fontkit') as { create: (bytes: Uint8Array) => object }
  let proto = Object.getPrototypeOf(cjsFontkit.create(regular))
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'layout')) proto = Object.getPrototypeOf(proto)
  const owner = proto as { layout: (...args: unknown[]) => unknown }
  const patched = owner.layout
  const words: string[] = []
  owner.layout = function record(this: unknown, ...args: unknown[]) {
    if (typeof args[0] === 'string' && args[0].trim()) words.push(args[0].trim())
    return patched.apply(this, args)
  }
  try {
    await render(language, source)
  } finally {
    owner.layout = patched
  }
  return words
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

  it('draws a right-to-left line with its words in visual order, not logical', async () => {
    const words = await recordDrawnWords('fa')

    // The subtitle reads «گزارش درآمد فریلنسری بر پایه‌ی ثبت‌های شخصی». Drawn left
    // to right, «شخصی» has to come first and «گزارش» last — the reverse. It
    // previously drew logical-first, which printed the sentence backwards.
    const first = words.lastIndexOf('شخصی')
    const last = words.lastIndexOf('گزارش')
    expect(first).toBeGreaterThanOrEqual(0)
    expect(last).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(last)
  })

  it('draws a month name after its year, so the year sits to the left', async () => {
    const words = await recordDrawnWords('fa')

    // «فروردین ۱۴۰۵» must be drawn ۱۴۰۵ first (leftmost), then فروردین.
    const year = words.lastIndexOf('۱۴۰۵')
    const month = words.lastIndexOf('فروردین')
    expect(year).toBeGreaterThanOrEqual(0)
    expect(month).toBeGreaterThanOrEqual(0)
    expect(year).toBeLessThan(month)
  })

  it('starts a second page instead of drawing past the bottom of the first', async () => {
    const short = await render('fa')
    const long = await render('fa', fullYear)

    expect(pageCount(short.raw)).toBe(1)
    expect(pageCount(long.raw)).toBeGreaterThan(1)
  })

  it('carries the overflow onto the second page rather than losing it', async () => {
    const words = await recordDrawnWords('fa', fullYear)

    // The closing footnote is the last thing drawn, and it is what used to land
    // below the paper. Present here means the whole document made it onto pages.
    expect(words).toContain('خودش')
  })

  it('renders both the Persian and the English certificate without throwing', async () => {
    const fa = await render('fa')
    const en = await render('en')

    // A certificate is a page of type; a few KB would mean it drew nothing.
    expect(fa.bytes.length).toBeGreaterThan(20_000)
    expect(en.bytes.length).toBeGreaterThan(20_000)
  })
})
