import type { I18n, MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { AppLocale, CalendarSystem, IncomeReport } from 'src/shared/types'
import {
  formatDateEnglish,
  formatDateLong,
  formatNumber,
  monthNames,
  numberToWords,
  toEnglishDigits,
  toPersianDigits,
  yearOf,
} from 'src/shared/utils'

export type ReportLanguage = 'fa' | 'en'

export interface CertificateRow {
  label: string
  value: string
}

export interface CertificateMonthRow {
  key: string
  month: string
  count: string
  amount: string
}

/**
 * Every word and figure the income certificate contains. The on-screen document
 * and the PDF both render this and hold no field list of their own, so a field
 * added here reaches both surfaces or neither.
 */
export interface CertificateModel {
  direction: 'rtl' | 'ltr'
  locale: AppLocale
  title: string
  subtitle: string
  issuer: string
  serialLabel: string
  serial: string
  identity: CertificateRow[]
  summary: CertificateRow[]
  totalLabel: string
  totalFigure: string
  totalInWordsLabel: string
  totalInWords: string
  breakdownTitle: string
  columns: { month: string; count: string; amount: string }
  months: CertificateMonthRow[]
  averageBasis: string
  footnote: string
  /** True when the profile has no name, so the page is not presentable yet. */
  incomplete: boolean
}

const LABELS = {
  title: msg`Statement of Income`,
  subtitle: msg`A self-recorded statement of freelance income`,
  issuer: msg`Issued by Daramadname`,
  serial: msg`Reference`,
  fullName: msg`Full name`,
  nationalId: msg`National ID`,
  passportNumber: msg`Passport number`,
  phone: msg`Phone`,
  address: msg`Address`,
  period: msg`Reporting period`,
  issuedOn: msg`Issued on`,
  total: msg`Total income`,
  totalInWords: msg`In words`,
  average: msg`Average monthly income`,
  breakdown: msg`Month-by-month breakdown`,
  month: msg`Month`,
  count: msg`Receipts`,
  amount: msg`Amount`,
  toman: msg`Toman`,
  footnote: msg`This statement was produced from receipts the holder recorded themselves in Daramadname. It is a personal record, not a bank or tax authority document, and is intended to be read alongside supporting bank statements.`,
} satisfies Record<string, MessageDescriptor>

const REFERENCE_PREFIX = 'DN'

/**
 * A short reference the holder can quote, derived from the period, the total and
 * the issue date, so reprinting the same report yields the same string.
 */
const referenceFor = (report: IncomeReport, year: number): string => {
  const seed = `${report.range.from}|${report.range.to}|${report.totalToman}|${report.generatedAt.slice(0, 10)}`
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  const suffix = hash.toString(36).toUpperCase().padStart(6, '0').slice(-6)
  return [REFERENCE_PREFIX, year, suffix].join('-')
}

export const buildCertificateModel = (
  report: IncomeReport,
  language: ReportLanguage,
  calendar: CalendarSystem,
  i18n: I18n,
): CertificateModel => {
  const t = (key: keyof typeof LABELS) => i18n._(LABELS[key])
  const persian = language === 'fa'

  // Numbering follows the DOCUMENT, not the interface: an English certificate
  // reads «147,750,000» and «21 Jul 2026» while the app itself stays Persian.
  const locale: AppLocale = persian ? 'fa-IR' : 'en-US'
  // Profile fields are stored exactly as typed, so a national ID may already
  // hold Persian digits. Normalise to ASCII, then re-render in the document's
  // own numerals.
  const digits = (value: number | string) => {
    const ascii = toEnglishDigits(String(value))
    return persian ? toPersianDigits(ascii) : ascii
  }
  const money = (value: number) => `${formatNumber(value, locale)} ${t('toman')}`
  const date = (iso: string) => (persian ? formatDateLong(iso, calendar, i18n) : formatDateEnglish(iso))

  const months = monthNames(calendar, i18n)

  // The reference carries the year the document COVERS, in the app's calendar,
  // not the ISO year: a Jalali 1405 report runs to 2027-03-20, so slicing the
  // ISO string would print 2027 beside dates that all read ۱۴۰۵.
  const year = yearOf(new Date(report.range.to), calendar)

  // The English certificate prefers the Latin spellings the holder entered,
  // only they know which one matches their passport. Persian is the fallback.
  const name = (persian ? report.profile.fullName : report.profile.fullNameEn) || report.profile.fullName
  const address = (persian ? report.profile.address : report.profile.addressEn) || report.profile.address

  const identity: CertificateRow[] = [
    { label: t('fullName'), value: name },
    { label: t('nationalId'), value: digits(report.profile.nationalId) },
    // The passport number keeps ASCII digits in BOTH documents: a passport
    // prints its number in Latin, so «K۱۲۳۴۵۶۷۸» would not match the document
    // an official is holding. A national ID card does use Persian numerals.
    { label: t('passportNumber'), value: toEnglishDigits(report.profile.passportNumber) },
    { label: t('phone'), value: digits(report.profile.phone) },
    { label: t('address'), value: address },
  ]
    .map((row) => ({ label: row.label, value: row.value.trim() }))
    // A row with no value is dropped, never printed against blank space.
    .filter((row) => row.value !== '')

  const words = numberToWords(report.totalToman, locale)

  return {
    direction: persian ? 'rtl' : 'ltr',
    locale,
    title: t('title'),
    subtitle: t('subtitle'),
    issuer: t('issuer'),
    serialLabel: t('serial'),
    serial: referenceFor(report, year),
    identity,
    summary: [
      { label: t('period'), value: `${date(report.range.from)} — ${date(report.range.to)}` },
      { label: t('issuedOn'), value: date(report.generatedAt) },
      { label: t('average'), value: money(report.monthlyAverageToman) },
    ],
    totalLabel: t('total'),
    totalFigure: money(report.totalToman),
    totalInWordsLabel: t('totalInWords'),
    totalInWords: words ? `${words} ${t('toman')}` : '',
    breakdownTitle: t('breakdown'),
    columns: { month: t('month'), count: t('count'), amount: t('amount') },
    months: report.months.map((entry) => ({
      key: `${entry.year}-${entry.month}`,
      month: `${months[entry.month - 1]} ${digits(entry.year)}`,
      count: digits(entry.receiptCount),
      amount: money(entry.totalToman),
    })),
    averageBasis: i18n._(msg`Monthly average: the total divided by ${digits(report.monthsInRange)} months of this period.`),
    footnote: t('footnote'),
    incomplete: !report.profile.fullName.trim(),
  }
}
