import { msg } from '@lingui/core/macro'
import { describe, expect, it } from 'vitest'
import { loadReportI18n } from './i18n'

// The report renders through its OWN i18n instance so an English certificate
// can be produced while the interface stays Persian. That instance is built
// with `setupI18n`, whose `messages` option is `AllMessages` — a map keyed BY
// LOCALE — not the flat catalog `loadAndActivate` takes.
//
// Handing it the flat catalog loads nothing, and every label silently falls
// back to its message id. Because English is the source locale those ids ARE
// English, so a Persian certificate printed "Total income" where it should
// have read «جمع کل درآمد» — with no error anywhere. The dynamic catalog
// import types as `any`, so TypeScript could not catch the shape mismatch.
//
// These assertions are the only thing standing between that bug and the demo.
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
