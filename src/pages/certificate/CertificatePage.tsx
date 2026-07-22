import { useLingui } from '@lingui/react/macro'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { Box, Button, CircularProgress, GlobalStyles, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { IncomeCertificate, useCertificateModel, type ReportLanguage } from 'src/shared/certificate'
import { getIncomeReportQuery, getIncomeReportQueryKey } from 'src/shared/queries'
import { yearOf, yearRange } from 'src/shared/utils'

/**
 * The certificate as a printable page.
 *
 * This route renders the document and nothing else — no nav, no chrome — so
 * the browser's own print engine produces the file. That buys correct Persian
 * shaping, نیم‌فاصله and full bidi ordering per visual line, none of which a
 * PDF library does reliably for mixed Persian and Latin text.
 *
 * It also removes a whole class of bug: the preview IS the output, so the two
 * cannot say different things.
 */
export const CertificatePage = () => {
  const { t } = useLingui()
  const [params] = useSearchParams()
  const { calendar } = useSettings()

  const language: ReportLanguage = params.get('lang') === 'en' ? 'en' : 'fa'
  const year = Number(params.get('year')) || yearOf(new Date(), calendar)
  const range = yearRange(year, calendar)

  const { data: report } = useQuery({
    queryKey: getIncomeReportQueryKey(range, calendar),
    queryFn: getIncomeReportQuery,
  })

  const model = useCertificateModel(report, language, calendar)

  // The browser names the saved PDF after the document title, so set it before
  // the print dialog can open rather than letting it read «درآمدنامه».
  useEffect(() => {
    if (!model) {
      return
    }
    const previous = window.document.title
    window.document.title = model.serial
    return () => {
      window.document.title = previous
    }
  }, [model])

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
        <Button variant="contained" startIcon={<PrintRoundedIcon />} disabled={!model} onClick={() => window.print()}>
          {t`Print or save as PDF`}
        </Button>
      </Stack>

      {model ? (
        <IncomeCertificate model={model} />
      ) : (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          {/* `role="progressbar"` with no text inside it has no accessible
              name of its own (axe `aria-progressbar-name`). */}
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      )}
    </Box>
  )
}
