import { i18n, type I18n } from '@lingui/core'
import type { AppLocale } from 'src/shared/types'

// English is the source locale — message ids in the code are English strings —
// but the app DEFAULTS to Persian at runtime, because that is who it is for.
// The choice is persisted in Settings.

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
 * it cannot share the app's active locale — switching the global locale to
 * render a document would flip the whole UI underneath the user.
 */
export const loadReportI18n = async (locale: AppLocale): Promise<I18n> => {
  const { setupI18n } = await import('@lingui/core')
  const { messages } = await import(`src/locales/${locale}/messages.ts`)

  // `setupI18n` takes `AllMessages` — a map KEYED BY LOCALE — whereas
  // `loadAndActivate` takes the flat catalog for one locale. Passing the flat
  // catalog here loads nothing: lookup of `messages[locale]` is undefined, so
  // every label silently falls back to its message id. Under an English source
  // locale those ids ARE English, which is how a Persian certificate printed
  // "Total income" instead of «جمع کل درآمد». The dynamic import types as
  // `any`, so TypeScript could not catch it.
  return setupI18n({ locale, messages: { [locale]: messages } })
}

export { i18n }
