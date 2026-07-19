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
export const buildIncomeReport = (report: IncomeReport, language: ReportLanguage, calendar: CalendarSystem): TDocumentDefinitions => {
  const t = language === 'fa' ? FA : EN
  const money = (value: number) =>
    language === 'fa' ? `${formatNumberPersian(value)} ${t.toman}` : `${formatNumberLatin(value)} ${t.toman}`
  const alignment = language === 'fa' ? 'right' : 'left'

  const monthLabel = (month: number, year: number) => {
    if (language === 'fa') {
      return `${monthNames(calendar)[month - 1]} ${toPersianDigits(year)}`
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
              { text: periodText(report, language, calendar), style: 'value' },
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

const periodText = (report: IncomeReport, language: ReportLanguage, calendar: CalendarSystem): string =>
  language === 'fa'
    ? `${formatDateLong(report.range.from, calendar)} تا ${formatDateLong(report.range.to, calendar)}`
    : `${formatDateEnglish(report.range.from)} — ${formatDateEnglish(report.range.to)}`

const GREGORIAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Label set for one language. Both catalogs below satisfy it. */
interface ReportStrings {
  title: string
  subtitle: string
  summary: string
  breakdown: string
  period: string
  total: string
  average: string
  month: string
  count: string
  amount: string
  fullName: string
  nationalId: string
  phone: string
  address: string
  toman: string
  disclaimer: string
}

const FA: ReportStrings = {
  title: 'گواهی درآمد',
  subtitle: 'گزارش درآمد ثبت‌شده‌ی فریلنسری',
  summary: 'خلاصه',
  breakdown: 'تفکیک ماه‌به‌ماه',
  period: 'بازه‌ی گزارش',
  total: 'جمع کل درآمد',
  average: 'میانگین درآمد ماهانه',
  month: 'ماه',
  count: 'تعداد دریافتی',
  amount: 'مبلغ',
  fullName: 'نام و نام خانوادگی',
  nationalId: 'کد ملی',
  phone: 'تلفن',
  address: 'نشانی',
  toman: 'تومان',
  disclaimer: 'این گزارش بر اساس داده‌هایی تولید شده که خودِ کاربر در برنامه‌ی درآمدنامه ثبت کرده است.',
}

const EN: ReportStrings = {
  title: 'Statement of Income',
  subtitle: 'Self-recorded freelance income report',
  summary: 'Summary',
  breakdown: 'Month-by-month breakdown',
  period: 'Reporting period',
  total: 'Total income',
  average: 'Average monthly income',
  month: 'Month',
  count: 'Payments',
  amount: 'Amount',
  fullName: 'Full name',
  nationalId: 'National ID',
  phone: 'Phone',
  address: 'Address',
  toman: 'Toman',
  disclaimer: 'This report was generated from records entered by the user in the Daramadname application.',
}
