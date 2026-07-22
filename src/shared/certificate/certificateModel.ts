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
 * Every word and figure the income certificate contains.
 *
 * This exists so the on-screen document and the PDF cannot say different
 * things. They previously did: the PDF printed national ID, phone and address
 * while the preview showed none of them, and the preview showed an issue date
 * the PDF lacked. Two renderers reading two hand-maintained field lists drift
 * the moment either is touched, and nobody notices until someone opens the
 * downloaded file.
 *
 * So content lives here and rendering lives elsewhere. A field added to the
 * model appears in both surfaces or in neither.
 */
export interface CertificateModel {
  language: ReportLanguage
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
  /** True when the profile has no name — the document is not presentable yet. */
  incomplete: boolean
}

const LABELS = {
  title: msg`Statement of Income`,
  subtitle: msg`A self-recorded statement of freelance income`,
  issuer: msg`Issued by Daramadname`,
  serial: msg`Reference`,
  fullName: msg`Full name`,
  nationalId: msg`National ID`,
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

/**
 * A short reference the holder can quote.
 *
 * Derived from the range and the total, so reprinting the same period the same
 * day yields the same reference — a serial that changed on every print would
 * undermine the very thing it exists to signal.
 */
const REFERENCE_PREFIX = 'DN'

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

  // The document's numbering is independent of the interface locale: an English
  // certificate must read «147,750,000» and «21 Jul 2026» even while the app
  // itself is in Persian.
  const locale: AppLocale = persian ? 'fa-IR' : 'en-US'
  // Profile fields are stored exactly as typed, so a national ID may already
  // hold Persian digits. Normalise to ASCII first, then re-render in the
  // DOCUMENT's numbering — otherwise an embassy officer receives «۰۰۱۲۳۴۵۶۷۸»
  // on an otherwise English page, and a user who typed ASCII gets Latin digits
  // on an otherwise Persian one.
  const digits = (value: number | string) => {
    const ascii = toEnglishDigits(String(value))
    return persian ? toPersianDigits(ascii) : ascii
  }
  const money = (value: number) => `${formatNumber(value, locale)} ${t('toman')}`
  const date = (iso: string) => (persian ? formatDateLong(iso, calendar, i18n) : formatDateEnglish(iso))

  const months = monthNames(calendar, i18n)

  // The reference carries the year the document COVERS, in the calendar the
  // document is written in. Slicing the ISO string would print 2027 on a
  // certificate whose every other date reads ۱۴۰۵.
  const year = yearOf(new Date(report.range.to), calendar)

  const identity: CertificateRow[] = []
  const pushIdentity = (label: string, value: string) => {
    if (value.trim()) {
      identity.push({ label, value: value.trim() })
    }
  }
  pushIdentity(t('fullName'), report.profile.fullName)
  pushIdentity(t('nationalId'), digits(report.profile.nationalId))
  pushIdentity(t('phone'), digits(report.profile.phone))
  pushIdentity(t('address'), report.profile.address)

  const words = numberToWords(report.totalToman, locale)

  return {
    language,
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
    // Gandom's note: an average with an unstated divisor is dangerous on a
    // document meant to be believed. State it on the page.
    averageBasis: i18n._(
      msg`The monthly average divides the total by the ${digits(report.monthsInRange)} calendar months in the period, including months with no income.`,
    ),
    footnote: t('footnote'),
    incomplete: !report.profile.fullName.trim(),
  }
}
