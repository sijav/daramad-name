import { useLingui } from '@lingui/react/macro'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { Box, Button, CircularProgress, GlobalStyles, Paper, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { IncomeCertificate, useCertificateModel, type ReportLanguage } from 'src/shared/certificate'
import { EmptyState } from 'src/shared/empty-state'
import { getIncomeReportQuery, getIncomeReportQueryKey } from 'src/shared/queries'
import { yearOf, yearRange } from 'src/shared/utils'

/**
 * The certificate as a printable page.
 *
 * This route renders the document and nothing else — no nav, no chrome — so
 * the file comes out of the browser's own typesetting engine, and the preview
 * IS the output: there is no second renderer for the two to disagree about.
 *
 * It is also the cheap route. The downloadable PDF pulls in the ~700 KB
 * pdfkit/fontkit chunk and the embedded Vazirmatn cuts; this needs none of
 * that. The PDF still earns its place — it is a file you can attach to an
 * email — but for reading and printing this page is the whole feature.
 */
export const CertificatePage = () => {
  const { t } = useLingui()
  const [params] = useSearchParams()
  const { calendar } = useSettings()

  const language: ReportLanguage = params.get('lang') === 'en' ? 'en' : 'fa'
  const year = Number(params.get('year')) || yearOf(new Date(), calendar)
  const range = yearRange(year, calendar)

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: getIncomeReportQueryKey(range, calendar),
    queryFn: getIncomeReportQuery,
  })

  const [documentError, setDocumentError] = useState<Error | null>(null)
  const model = useCertificateModel(report, language, calendar, setDocumentError)

  const failed = isError || documentError !== null
  // A certificate for a year the holder recorded nothing in is worse than no
  // certificate: it is a signed-looking statement that the person earned zero.
  // The report page already refuses this case, but `?year=` is hand-editable
  // and this route is reachable directly, so that guard is not a guard here.
  const hasIncome = (report?.totalToman ?? 0) > 0
  // The one condition under which a document may be drawn, printed, or named.
  const document_ = !failed && hasIncome ? model : null

  // The browser names the saved PDF after the document title, so set it before
  // the print dialog can open rather than letting it read «درآمدنامه».
  useEffect(() => {
    if (!document_) {
      return
    }
    const previous = window.document.title
    window.document.title = document_.serial
    return () => {
      window.document.title = previous
    }
  }, [document_])

  return (
    <Box sx={{ backgroundColor: '#eceef1', minHeight: '100vh', py: { xs: 2, sm: 5 }, px: { xs: 1, sm: 2 } }}>
      <GlobalStyles
        styles={{
          // Real A4 geometry. The margin lives here rather than on the element
          // so the browser's own header and footer sit outside the content.
          '@page': { size: 'A4', margin: '14mm' },
          '@media print': {
            'html, body': { backgroundColor: '#ffffff', margin: 0, padding: 0 },
            '.no-print': { display: 'none !important' },
          },
        }}
      />

      <Stack className="no-print" direction="row" sx={{ justifyContent: 'center', mb: 3 }}>
        <Button variant="contained" startIcon={<PrintRoundedIcon />} disabled={!document_} onClick={() => window.print()}>
          {t`Print or save as PDF`}
        </Button>
      </Stack>

      {failed ? (
        <Notice>
          <EmptyState
            icon={<ErrorOutlineRoundedIcon />}
            title={t`The certificate could not be produced`}
            description={t`Your data is safe and has not been erased. Try again.`}
            actionLabel={t`Try again`}
            // A reload rather than a refetch: the failure this most often is —
            // a catalog chunk that no longer exists after a redeploy — is fixed
            // by asking the server again, and a reload also re-runs the query.
            onAction={() => window.location.reload()}
          />
        </Notice>
      ) : isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          {/* `role="progressbar"` with no text inside it has no accessible
              name of its own (axe `aria-progressbar-name`). */}
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      ) : !hasIncome ? (
        <Notice>
          <EmptyState
            icon={<DescriptionRoundedIcon />}
            title={t`No receipts recorded for this year`}
            description={t`A certificate for a year with nothing recorded would state that you earned zero. Record the receipts for that year first, then open the document again.`}
          />
        </Notice>
      ) : document_ ? (
        <IncomeCertificate model={document_} />
      ) : (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      )}
    </Box>
  )
}

/**
 * A sheet of paper for the messages that stand in for the document.
 *
 * Sized and centred like the certificate itself so the page does not lurch when
 * one replaces the other — and marked `no-print`, because a message explaining
 * why there is no document must never be the thing that prints.
 */
const Notice = ({ children }: { children: ReactNode }) => (
  <Paper className="no-print" elevation={0} sx={{ width: '210mm', maxWidth: '100%', marginInline: 'auto', borderRadius: 2 }}>
    {children}
  </Paper>
)
