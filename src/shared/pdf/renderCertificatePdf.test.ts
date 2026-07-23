import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import { loadReportI18n } from 'src/core/i18n'
import { buildCertificateModel } from 'src/shared/certificate'
import type { IncomeReport } from 'src/shared/types'
import { describe, expect, it } from 'vitest'
import { installBidiLayout } from './bidiText'
import { buildIncomeReport } from './buildIncomeReport'
import { type PdfDocumentConstructor, renderCertificatePdf } from './renderCertificatePdf'

// The whole download pipeline in Node: model -> blocks -> pdfkit. Nothing here
// looks at a rendered page, so the assertions cover what a terminal still can
// check: a valid file, the embedded font, a ToUnicode map, visual word order and
// page breaks.

// @types/pdfkit types the default export as an instance; at runtime it is the constructor.
const PdfCtor = PDFDocument as unknown as PdfDocumentConstructor

const fontUrl = (name: string) => fileURLToPath(new URL(`../../../node_modules/vazirmatn/fonts/ttf/${name}`, import.meta.url))
const regular = readFileSync(fontUrl('Vazirmatn-Regular.ttf'))
const bold = readFileSync(fontUrl('Vazirmatn-Bold.ttf'))

/** The prototype that owns `layout`, which is where the bidi patch and the recorder both go. */
const layoutOwner = (font: object): { layout: (...args: unknown[]) => unknown } => {
  let proto = Object.getPrototypeOf(font)
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'layout')) proto = Object.getPrototypeOf(proto)
  return proto
}

// pdfkit `require`s the CommonJS fontkit build, which need not be the ESM copy
// `bidiText.ts` imports, so everything here targets pdfkit's own. Patching now
// rather than leaving it to the first render keeps the recorder wrapped AROUND
// the bidi patch: the other way round it records run fragments, and restoring
// `layout` afterwards would drop the patch for the rest of the file.
const cjsFontkit: typeof import('fontkit') = createRequire(import.meta.url)('fontkit')
const pdfkitFont = cjsFontkit.create(regular)
installBidiLayout(pdfkitFont)
const fontProto = layoutOwner(pdfkitFont)

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

/** A full year of month rows under a long postal address: more than one A4 sheet holds. */
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

/** One `/Type /Page` object per sheet. The `\b` keeps the `/Type /Pages` tree node out of the count. */
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
 * the order it receives them, so this sequence is the visual order on the page,
 * which for a right-to-left line is the REVERSE of the logical word order. No
 * other assertion here would notice: a backwards line is still a valid,
 * font-embedded, selectable PDF.
 */
const recordDrawnWords = async (language: 'fa' | 'en', source: IncomeReport = report) => {
  const original = fontProto.layout
  const words: string[] = []
  fontProto.layout = function record(this: unknown, ...args: unknown[]) {
    if (typeof args[0] === 'string' && args[0].trim()) words.push(args[0].trim())
    return original.apply(this, args)
  }
  try {
    await render(language, source)
  } finally {
    fontProto.layout = original
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

    // The subtitle «گزارش درآمد فریلنسری بر پایه‌ی ثبت‌های شخصی», drawn left to
    // right, puts «شخصی» first and «گزارش» last, the reverse of reading order.
    const first = words.lastIndexOf('شخصی')
    const last = words.lastIndexOf('گزارش')
    expect(first).toBeGreaterThanOrEqual(0)
    expect(last).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(last)
  })

  it('draws a month name after its year, so the year sits to the left', async () => {
    const words = await recordDrawnWords('fa')

    // «فروردین ۱۴۰۵» is drawn ۱۴۰۵ first (leftmost), then فروردین.
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

    // «خودش» belongs to the footnote, the last block `buildIncomeReport` emits.
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
