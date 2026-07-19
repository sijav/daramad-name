// The whole domain. There is no server, so these types are authored here
// rather than generated from an API contract.

export type Currency = 'TOMAN' | 'USD' | 'USDT'

export type Channel = 'CARD_TO_CARD' | 'REMITTANCE' | 'TETHER' | 'OTHER'

export type CalendarSystem = 'JALALI' | 'GREGORIAN'

/**
 * Interface language. Persian is the product's default; English exists because
 * the audience deals with embassies and foreign clients.
 */
export type AppLocale = 'fa-IR' | 'en-US'

export const APP_LOCALES: readonly AppLocale[] = ['fa-IR', 'en-US']

/** Colour-scheme preference. `system` follows the OS and keeps following it. */
export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

export const CURRENCIES: readonly Currency[] = ['TOMAN', 'USD', 'USDT']
export const CHANNELS: readonly Channel[] = ['CARD_TO_CARD', 'REMITTANCE', 'TETHER', 'OTHER']

/** Toman is a whole-number currency; USD and USDT carry two decimals. */
export const currencyDecimals: Record<Currency, number> = {
  TOMAN: 0,
  USD: 2,
  USDT: 2,
}

export interface Client {
  id: string
  name: string
  /** Lowercased, trimmed `name`. Dexie indexes this so lookups are case-insensitive. */
  nameKey: string
  createdAt: string
}

export interface Receipt {
  id: string
  /** ISO-8601 instant. Every UI surface renders it through the user's calendar setting. */
  occurredAt: string
  /** The amount exactly as typed, denominated in `currency`. */
  amountOriginal: number
  currency: Currency
  /**
   * Toman per one unit of `currency`, captured at record time. Null for TOMAN.
   * Frozen forever — a later rate change must never restate history.
   */
  rate: number | null
  /**
   * `amountOriginal * rate`, rounded to whole toman, computed once on write and
   * persisted. Never recomputed on read; that is what makes the freeze real.
   */
  amountToman: number
  clientId: string | null
  channel: Channel
  note: string | null
  createdAt: string
  updatedAt: string
}

/** Identity block printed on the income report. There is no login, so the user types this in Settings. */
export interface Profile {
  fullName: string
  nationalId: string
  phone: string
  address: string
}

export interface Settings {
  calendar: CalendarSystem
  /** Persisted so the choice survives a reload; defaults to Persian. */
  locale: AppLocale
  /** Persisted colour scheme; defaults to following the OS. */
  themePreference: ThemePreference
  profile: Profile
}

export interface DateRange {
  /** Inclusive ISO-8601 instant. */
  from: string
  /** Inclusive ISO-8601 instant. */
  to: string
}

export interface LedgerFilter {
  range?: DateRange
  clientId?: string
  channel?: Channel
}

export type LedgerSortField = 'occurredAt' | 'amountToman' | 'client' | 'channel'
export type SortDirection = 'asc' | 'desc'

export interface LedgerSort {
  field: LedgerSortField
  direction: SortDirection
}

/** A receipt with its client resolved, which is what every table row actually needs. */
export interface ReceiptWithClient extends Receipt {
  clientName: string | null
}

export interface LedgerSummary {
  /** Sum over the CURRENT filter, not over the whole database. */
  totalToman: number
  receiptCount: number
  /** `totalToman` divided by the number of calendar months the range spans. */
  monthlyAverageToman: number
}

export interface Ledger {
  receipts: ReceiptWithClient[]
  summary: LedgerSummary
}

/** One bar of the 12-month chart. Months with no income are present with zero. */
export interface MonthlyTotal {
  /** 1-12 within `year`, in the user's calendar system. */
  month: number
  year: number
  totalToman: number
  receiptCount: number
}

export interface ClientShare {
  clientId: string
  clientName: string
  totalToman: number
  /** 0-100, one decimal. */
  percentage: number
}

/**
 * Concentration warning, non-null only when the top client exceeds this share.
 * The brief sets the rule at 50%; scenario 4's «۷۰٪» was an illustration of it.
 */
export const CONCENTRATION_THRESHOLD = 50

export interface ConcentrationInsight {
  clientName: string
  percentage: number
}

export interface IncomeReport {
  profile: Profile
  range: DateRange
  totalToman: number
  monthlyAverageToman: number
  months: MonthlyTotal[]
  generatedAt: string
}

/** Shape of the backup file. `version` lets a future format migrate instead of failing. */
export interface BackupFile {
  app: 'daramadname'
  version: 1
  exportedAt: string
  receipts: Receipt[]
  clients: Client[]
  settings: Settings
}
