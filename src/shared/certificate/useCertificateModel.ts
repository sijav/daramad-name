import type { I18n } from '@lingui/core'
import { useEffect, useRef, useState } from 'react'
import { loadReportI18n } from 'src/core/i18n'
import type { CalendarSystem, IncomeReport } from 'src/shared/types'
import { buildCertificateModel, type CertificateModel, type ReportLanguage } from './certificateModel'

/**
 * Builds the certificate model against the DOCUMENT's language rather than the
 * interface's.
 *
 * The document gets its own i18n instance so an English certificate can be
 * produced while the app stays Persian, switching the global locale to render
 * a document would flip the whole UI underneath the user mid-task.
 *
 * Both the preview on the report page and the printable route call this, which
 * is what guarantees the preview shows exactly what prints.
 *
 * @param onLoadError Called when the document's catalog cannot be loaded. The
 *   catalog arrives through two dynamic imports, which reject on a stale chunk
 *   URL after a redeploy or on a cold offline load, and without this the hook
 *   just keeps returning `null`, which a caller cannot tell apart from "still
 *   loading". On the printable route that is an indefinite spinner on the one
 *   page whose entire purpose is to be printed.
 */
export const useCertificateModel = (
  report: IncomeReport | undefined,
  language: ReportLanguage,
  calendar: CalendarSystem,
  onLoadError?: (cause: Error) => void,
): CertificateModel | null => {
  const [documentI18n, setDocumentI18n] = useState<I18n | null>(null)
  // Kept in a ref rather than named as a dependency below, so a caller passing
  // an inline arrow does not restart the catalog import on every one of its
  // renders.
  const reportError = useRef(onLoadError)
  useEffect(() => {
    reportError.current = onLoadError
  })

  useEffect(() => {
    let cancelled = false
    loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')
      .then((instance) => {
        if (!cancelled) {
          setDocumentI18n(instance)
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          reportError.current?.(cause instanceof Error ? cause : new Error(String(cause)))
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
