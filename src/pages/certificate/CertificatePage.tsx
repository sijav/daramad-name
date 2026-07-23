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

// The printable certificate route. `?year=` and `?lang=` are its whole
// configuration, and it renders outside the app shell so only the document prints.
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

  const [catalogFailed, setCatalogFailed] = useState(false)
  const model = useCertificateModel(report, language, calendar, () => setCatalogFailed(true))

  const failed = isError || catalogFailed
  // The report page refuses to link out for an empty year, but `?year=` is
  // hand-editable and this route is reachable directly, so re-check it here.
  const hasIncome = (report?.totalToman ?? 0) > 0
  const certificate = !failed && hasIncome ? model : null
  // The catalog import runs after the query resolves, so a report with income
  // and no model yet is still loading, not empty.
  const pending = isLoading || (hasIncome && model === null)

  // Browsers name the saved PDF after `document.title`, so print gets the
  // serial rather than the app name.
  useEffect(() => {
    if (!certificate) {
      return
    }
    const previous = window.document.title
    window.document.title = certificate.serial
    return () => {
      window.document.title = previous
    }
  }, [certificate])

  // The backdrop is a literal colour, like the sheet's own: a printed document
  // has no dark mode, so the desk it sits on does not get one either.
  return (
    <Box sx={{ backgroundColor: '#eceef1', minHeight: '100vh', py: { xs: 2, sm: 5 }, px: { xs: 1, sm: 2 } }}>
      <GlobalStyles
        styles={{
          // The margin belongs to `@page`, not the element, so the browser's own
          // header and footer sit outside the content.
          '@page': { size: 'A4', margin: '14mm' },
          '@media print': {
            'html, body': { backgroundColor: '#ffffff', margin: 0, padding: 0 },
            '.no-print': { display: 'none !important' },
          },
        }}
      />

      <Stack className="no-print" direction="row" sx={{ justifyContent: 'center', mb: 3 }}>
        <Button variant="contained" startIcon={<PrintRoundedIcon />} disabled={!certificate} onClick={() => window.print()}>
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
            // Reload, not refetch: the usual failure is a catalog chunk that no
            // longer exists after a redeploy, and only a fresh load replaces it.
            onAction={() => window.location.reload()}
          />
        </Notice>
      ) : pending ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          {/* `role="progressbar"` with no text inside it has no accessible name
              of its own (axe `aria-progressbar-name`). */}
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      ) : certificate ? (
        <IncomeCertificate model={certificate} />
      ) : (
        <Notice>
          <EmptyState
            icon={<DescriptionRoundedIcon />}
            title={t`No receipts recorded for this year`}
            description={t`A certificate for a year with nothing recorded would state that you earned zero. Record the receipts for that year first, then open the document again.`}
          />
        </Notice>
      )}
    </Box>
  )
}

// A sheet the width of the certificate (210mm), so the page does not shift when a
// message stands in for the document. `no-print` keeps the message off paper.
const Notice = ({ children }: { children: ReactNode }) => (
  <Paper className="no-print" elevation={0} sx={{ width: '210mm', maxWidth: '100%', marginInline: 'auto', borderRadius: 2 }}>
    {children}
  </Paper>
)
