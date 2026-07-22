import type { I18n } from '@lingui/core'
import { useEffect, useState } from 'react'
import { loadReportI18n } from 'src/core/i18n'
import type { CalendarSystem, IncomeReport } from 'src/shared/types'
import { buildCertificateModel, type CertificateModel, type ReportLanguage } from './certificateModel'

/**
 * Builds the certificate model against the DOCUMENT's language rather than the
 * interface's.
 *
 * The document gets its own i18n instance so an English certificate can be
 * produced while the app stays Persian — switching the global locale to render
 * a document would flip the whole UI underneath the user mid-task.
 *
 * Both the preview on the report page and the printable route call this, which
 * is what guarantees the preview shows exactly what prints.
 */
export const useCertificateModel = (
  report: IncomeReport | undefined,
  language: ReportLanguage,
  calendar: CalendarSystem,
): CertificateModel | null => {
  const [documentI18n, setDocumentI18n] = useState<I18n | null>(null)

  useEffect(() => {
    let cancelled = false
    loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US').then((instance) => {
      if (!cancelled) {
        setDocumentI18n(instance)
      }
    })
    return () => {
      cancelled = true
    }
  }, [language])

  if (!report || !documentI18n) {
    return null
  }
  return buildCertificateModel(report, language, calendar, documentI18n)
}
