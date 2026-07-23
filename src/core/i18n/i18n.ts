import { i18n, setupI18n, type I18n } from '@lingui/core'
import type { AppLocale } from 'src/shared/types'

// English is the source locale, so message ids in the code are English strings.
// The app still defaults to Persian at runtime; the choice lives in Settings.

export const DEFAULT_LOCALE: AppLocale = 'fa-IR'

/** Loads a compiled catalog and activates it on the shared i18n instance. */
export const activateLocale = async (locale: AppLocale): Promise<void> => {
  if (i18n.locale === locale) {
    return
  }
  const { messages } = await import(`src/locales/${locale}/messages.ts`)
  i18n.loadAndActivate({ locale, messages })
}

/**
 * A second, independent i18n instance for the PDF.
 *
 * The report can be produced in English while the interface stays Persian, so
 * it cannot share the app's active locale. Switching the global locale to
 * render a document would flip the whole UI underneath the user.
 */
export const loadReportI18n = async (locale: AppLocale): Promise<I18n> => {
  const { messages } = await import(`src/locales/${locale}/messages.ts`)

  // `setupI18n` wants `AllMessages`, keyed BY LOCALE, where `loadAndActivate`
  // wants the flat catalog for one locale. Hand it the flat one and it loads
  // nothing, so every label falls back to its message id, and under an English
  // source locale those ids are English: that is how a Persian certificate once
  // printed "Total income". The dynamic import types as `any`, so TypeScript
  // cannot catch the mistake.
  return setupI18n({ locale, messages: { [locale]: messages } })
}

export { i18n }
