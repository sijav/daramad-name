import type { I18n, MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import type { CalendarSystem, IncomeReport } from 'src/shared/types'
import { formatDateEnglish, formatDateLong, formatNumberLatin, formatNumberPersian, monthNames, toPersianDigits } from 'src/shared/utils'

export type ReportLanguage = 'fa' | 'en'

/**
 * Builds the income-certificate document (scenario 3).
 *
 * Two languages, one layout. The English variant is not a translation of the
 * labels alone — it also switches to Gregorian dates and Latin digits, because
 * an embassy officer cannot read «۱۴۰۴/۰۵/۲۳» or «۱۲٬۵۰۰٬۰۰۰».
 */
export const buildIncomeReport = (
  report: IncomeReport,
  language: ReportLanguage,
  calendar: CalendarSystem,
  i18n: I18n,
): TDocumentDefinitions => {
  const t = resolveLabels(i18n)
  const money = (value: number) =>
    language === 'fa' ? `${formatNumberPersian(value)} ${t.toman}` : `${formatNumberLatin(value)} ${t.toman}`
  const alignment = language === 'fa' ? 'right' : 'left'

  const monthLabel = (month: number, year: number) => {
    if (language === 'fa') {
      return `${monthNames(calendar, i18n)[month - 1]} ${toPersianDigits(year)}`
    }
    return `${GREGORIAN_SHORT[month - 1]} ${year}`
  }

  return {
    pageSize: 'A4',
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: 'Vazirmatn', fontSize: 10, alignment },
    info: { title: t.title, author: report.profile.fullName || 'Daramadname' },

    content: [
      { text: t.title, style: 'title', alignment },
      { text: t.subtitle, style: 'subtitle', alignment, margin: [0, 0, 0, 18] },

      // Identity block. Rows with no value are dropped rather than printed
      // empty, so an unfilled profile does not produce a document with blanks.
      {
        table: {
          widths: ['*', 'auto'],
          body: identityRows(report, t),
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 18],
      },

      { text: t.summary, style: 'section', alignment },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: t.period, style: 'label' },
              { text: periodText(report, language, calendar, i18n), style: 'value' },
            ],
            [
              { text: t.total, style: 'label' },
              { text: money(report.totalToman), style: 'valueStrong' },
            ],
            [
              { text: t.average, style: 'label' },
              { text: money(report.monthlyAverageToman), style: 'value' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 18],
      },

      { text: t.breakdown, style: 'section', alignment },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: t.month, style: 'th' },
              { text: t.count, style: 'th' },
              { text: t.amount, style: 'th' },
            ],
            ...report.months.map((month) => [
              { text: monthLabel(month.month, month.year), style: 'td' },
              { text: language === 'fa' ? toPersianDigits(month.receiptCount) : String(month.receiptCount), style: 'td' },
              { text: money(month.totalToman), style: 'td' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },

      {
        text: t.disclaimer,
        style: 'footer',
        alignment,
        margin: [0, 24, 0, 0],
      },
    ],

    styles: {
      title: { fontSize: 20, bold: true, margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 10, color: '#494b50' },
      section: { fontSize: 13, bold: true, margin: [0, 0, 0, 8] },
      label: { fontSize: 10, color: '#494b50' },
      value: { fontSize: 11 },
      valueStrong: { fontSize: 13, bold: true, color: '#3b6ef5' },
      th: { fontSize: 10, bold: true, fillColor: '#e9eaec' },
      td: { fontSize: 10 },
      footer: { fontSize: 8, color: '#7c7e83', italics: true },
    },
  }
}

const identityRows = (report: IncomeReport, t: ReportStrings) => {
  const rows: { text: string; style: string }[][] = []
  const push = (label: string, value: string) => {
    if (value.trim()) {
      rows.push([
        { text: label, style: 'label' },
        { text: value, style: 'value' },
      ])
    }
  }
  push(t.fullName, report.profile.fullName)
  push(t.nationalId, report.profile.nationalId)
  push(t.phone, report.profile.phone)
  push(t.address, report.profile.address)

  // A table with zero rows throws inside pdfmake, so guarantee at least one.
  if (rows.length === 0) {
    rows.push([
      { text: t.fullName, style: 'label' },
      { text: '—', style: 'value' },
    ])
  }
  return rows
}

const periodText = (report: IncomeReport, language: ReportLanguage, calendar: CalendarSystem, i18n: I18n): string =>
  language === 'fa'
    ? `${formatDateLong(report.range.from, calendar, i18n)} ${i18n._(msg`تا`)} ${formatDateLong(report.range.to, calendar, i18n)}`
    : `${formatDateEnglish(report.range.from)} — ${formatDateEnglish(report.range.to)}`

const GREGORIAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * The report's labels, as lazy descriptors.
 *
 * Resolved through the i18n instance passed into `buildIncomeReport`, which is
 * a SEPARATE instance from the app's — that is what lets the user download an
 * English certificate while the interface stays Persian.
 */
const REPORT_LABELS = {
  title: msg`گواهی درآمد`,
  subtitle: msg`گزارش درآمد ثبت‌شده‌ی فریلنسری`,
  summary: msg`خلاصه`,
  breakdown: msg`تفکیک ماه‌به‌ماه`,
  period: msg`بازه‌ی گزارش`,
  total: msg`جمع کل درآمد`,
  average: msg`میانگین درآمد ماهانه`,
  month: msg`ماه`,
  count: msg`تعداد دریافتی`,
  amount: msg`مبلغ`,
  fullName: msg`نام و نام خانوادگی`,
  nationalId: msg`کد ملی`,
  phone: msg`تلفن`,
  address: msg`نشانی`,
  toman: msg`تومان`,
  disclaimer: msg`این گزارش بر اساس داده‌هایی تولید شده که خودِ کاربر در برنامه‌ی درآمدنامه ثبت کرده است.`,
} satisfies Record<string, MessageDescriptor>

type ReportStrings = Record<keyof typeof REPORT_LABELS, string>

const resolveLabels = (i18n: I18n): ReportStrings =>
  Object.fromEntries(Object.entries(REPORT_LABELS).map(([key, descriptor]) => [key, i18n._(descriptor)])) as ReportStrings
