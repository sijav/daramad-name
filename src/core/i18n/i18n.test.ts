import { msg } from '@lingui/core/macro'
import { describe, expect, it } from 'vitest'
import { activateLocale, DEFAULT_LOCALE, i18n, loadReportI18n } from './i18n'

// The report renders through its OWN i18n instance so an English certificate
// can be produced while the interface stays Persian. That instance is built
// with `setupI18n`, whose `messages` option is `AllMessages`, a map keyed BY
// LOCALE, not the flat catalog `loadAndActivate` takes.
//
// Handing it the flat catalog loads nothing and every label falls back to its
// message id. English being the source locale, those ids ARE English, so a
// Persian certificate printed "Total income" for «جمع کل درآمد» with no error
// anywhere. The dynamic import types as `any`, so tsc cannot catch the shape.
describe('loadReportI18n', () => {
  it('resolves Persian translations, not the English message ids', async () => {
    const reportI18n = await loadReportI18n('fa-IR')

    expect(reportI18n._(msg`Total income`)).toBe('جمع کل درآمد')
    expect(reportI18n._(msg`Average monthly income`)).toBe('میانگین درآمد ماهانه')
  })

  it('resolves English for the embassy variant', async () => {
    const reportI18n = await loadReportI18n('en-US')

    expect(reportI18n._(msg`Total income`)).toBe('Total income')
  })

  it('does not leak its locale onto the shared instance', async () => {
    const { i18n } = await import('@lingui/core')
    const before = i18n.locale

    await loadReportI18n('en-US')

    expect(i18n.locale).toBe(before)
  })
})

// `useLocaleSync` gates the first render on this, and seeds `ready` from the
// identity check `i18n.locale === locale`. So two things matter: the catalog
// lands, and the tag comes back EXACTLY as asked. A normalised «fa» or «fa_IR»
// leaves the gate shut and the app sits on a spinner with no error.
describe('activateLocale', () => {
  it('loads the catalog, so components render Persian rather than message ids', async () => {
    await activateLocale('fa-IR')

    expect(i18n._(msg`Total income`)).toBe('جمع کل درآمد')
  })

  it('reports the locale back verbatim, which is what opens the render gate', async () => {
    await activateLocale('fa-IR')
    expect(i18n.locale).toBe('fa-IR')

    await activateLocale('en-US')
    expect(i18n.locale).toBe('en-US')
  })

  it('actually swaps the catalog when the user changes language, and back again', async () => {
    await activateLocale('en-US')
    expect(i18n._(msg`Total income`)).toBe('Total income')

    await activateLocale('fa-IR')
    expect(i18n._(msg`Total income`)).toBe('جمع کل درآمد')
  })

  // Re-activating the current locale is the common case, the effect re-runs on
  // every mount. It must leave the loaded catalog exactly where it was rather
  // than blanking it mid-session.
  it('is a no-op when the locale is already active', async () => {
    await activateLocale('fa-IR')
    await activateLocale('fa-IR')

    expect(i18n.locale).toBe('fa-IR')
    expect(i18n._(msg`Total income`)).toBe('جمع کل درآمد')
  })

  // The app defaults to Persian; English is opt-in. A flipped default would
  // greet every first-time visitor in the wrong language.
  it('defaults to Persian', () => {
    expect(DEFAULT_LOCALE).toBe('fa-IR')
  })
})
