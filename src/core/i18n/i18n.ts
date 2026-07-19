import { i18n, type I18n } from '@lingui/core'

// The interface locale is Persian and does not change at runtime — the brief
// specifies a Persian-only UI. English exists solely for the income report's
// English variant (scenario 3, the embassy copy), which is rendered by pdfmake
// rather than React and therefore uses its own isolated i18n instance.

export const DEFAULT_LOCALE = 'fa-IR'
export type AppLocale = 'fa-IR' | 'en-US'

/** Loads a compiled catalog and activates it on the shared i18n instance. */
export const activateLocale = async (locale: AppLocale): Promise<void> => {
  const { messages } = await import(`src/locales/${locale}/messages.ts`)
  i18n.loadAndActivate({ locale, messages })
}

/**
 * A second, independent i18n instance for the PDF.
 *
 * The report can be produced in English while the interface stays Persian, so
 * it cannot share the app's active locale — switching the global locale to
 * render a document would flip the whole UI underneath the user.
 */
export const loadReportI18n = async (locale: AppLocale): Promise<I18n> => {
  const { setupI18n } = await import('@lingui/core')
  const { messages } = await import(`src/locales/${locale}/messages.ts`)
  return setupI18n({ locale, messages })
}

export { i18n }
