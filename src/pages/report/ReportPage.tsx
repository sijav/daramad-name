import { Trans, useLingui } from '@lingui/react/macro'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { radius } from 'src/core/theme'
import { IncomeCertificate, useCertificateModel, type ReportLanguage } from 'src/shared/certificate'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { PageActions, selectableYears, useReportYear } from 'src/shared/page-actions'
import { PageHeader } from 'src/shared/page-header'
import { loadPdf } from 'src/shared/pdf'
import { getIncomeReportQuery, getIncomeReportQueryKey, getPopulatedYearsQuery, getPopulatedYearsQueryKey } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { SurfaceCard } from 'src/shared/surface-card'
import { yearRange } from 'src/shared/utils'

const CERTIFICATE_PATH = 'certificate'

/** Scenario 3: a presentable income certificate, in Persian or English. */
export const ReportPage = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  const { calendar } = useSettings()
  const [year, setYear] = useReportYear(calendar)
  const [language, setLanguage] = useState<ReportLanguage>('fa')
  const [error, setError] = useState<string | null>(null)
  const rangeLabelId = useId()

  const range = yearRange(year, calendar)

  const { data: years = [] } = useQuery({
    queryKey: getPopulatedYearsQueryKey(calendar),
    queryFn: getPopulatedYearsQuery,
  })

  const { data: report, isLoading } = useQuery({
    queryKey: getIncomeReportQueryKey(range, calendar),
    queryFn: getIncomeReportQuery,
  })

  // The preview below and the file the user takes away are built from this one
  // model, so they cannot say different things.
  const model = useCertificateModel(report, language, calendar)

  const { mutate: download, isPending } = useMutation({
    mutationFn: async () => {
      if (!model) {
        return
      }
      const renderer = await loadPdf()
      const blob = await renderer.createCertificate(model)
      // A one-click download from a Blob: the report never leaves the browser,
      // so there is no URL to navigate to — the object URL is created, clicked
      // and revoked in place.
      const url = window.URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = `${model.serial}.pdf`
      anchor.click()
      window.URL.revokeObjectURL(url)
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const hasIncome = (report?.totalToman ?? 0) > 0

  // Built from Vite's base rather than the router, because this opens in a new
  // tab. BASE_URL always carries its trailing slash, and it is what makes the
  // link survive being served from a repository subpath on GitHub Pages.
  const printQuery = new URLSearchParams({ year: String(year), lang: language })
  const printHref = `${import.meta.env.BASE_URL}${CERTIFICATE_PATH}?${printQuery}`

  return (
    <Box>
      <PageHeader
        title={t`Income report`}
        subtitle={t`A document you can hand to an embassy, a landlord or an accountant`}
        action={<PageActions year={year} years={years} onYearChange={setYear} formatYear={digits} />}
      />

      {/* The design's report row: the document leads on the reading side, the
          configuration panel sits beside it in a fixed column. */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
              {/* `role="progressbar"` with no text inside it has no accessible
                  name of its own (axe `aria-progressbar-name`). */}
              <CircularProgress aria-label={t`Loading`} />
            </Box>
          ) : !hasIncome ? (
            <SurfaceCard radius="lg" flat>
              <EmptyState
                icon={<DescriptionRoundedIcon />}
                title={t`No receipts recorded for this year`}
                description={t`The income report is built from the receipts you record. Add a few receipts first, then produce the document here.`}
              />
            </SurfaceCard>
          ) : (
            <SurfaceCard radius="lg" flat>
              {model ? <IncomeCertificate model={model} variant="preview" /> : <CircularProgress aria-label={t`Loading`} />}
            </SurfaceCard>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SurfaceCard radius="lg" flat>
            <Stack spacing={2.5}>
              <Typography variant="h5">
                <Trans>Report settings</Trans>
              </Typography>

              <Stack spacing={1}>
                {/* The design writes the label as a caption above the control
                    rather than as a `<label>`, so the select opened as an
                    unnamed combobox (axe `aria-input-field-name`). `labelId` is
                    MUI's documented way to point a Select at an element that
                    already says what it is — better than a duplicated
                    `aria-label`, which would drift from the visible word. */}
                <Typography id={rangeLabelId} sx={{ color: 'text.secondary' }} variant="caption">
                  <Trans>Range</Trans>
                </Typography>
                <TextField
                  select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  fullWidth
                  slotProps={{ select: { labelId: rangeLabelId } }}
                  sx={(theme) => ({
                    '& .MuiOutlinedInput-root': {
                      height: 44,
                      borderRadius: `${radius.sm + 2}px`,
                      backgroundColor: theme.palette.surfaceSubtle,
                      fontSize: 13,
                    },
                    '& .MuiSelect-select': { paddingBlock: '0px', paddingInlineStart: '14px' },
                  })}
                >
                  {/* The selected year is always among the options, even before
                      the query answers and even for a year with no receipts —
                      a select whose value is missing renders blank, and the
                      range is the one thing this document must state. */}
                  {selectableYears(years, year).map((option) => (
                    <MenuItem key={option} value={option}>
                      {t`year ${digits(option)}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ color: 'text.secondary' }} variant="caption">
                  <Trans>Report language</Trans>
                </Typography>
                <SegmentedControl<ReportLanguage>
                  variant="subtle"
                  value={language}
                  options={[
                    { value: 'fa', label: t`Persian` },
                    { value: 'en', label: t`English` },
                  ]}
                  onValueChange={setLanguage}
                />
              </Stack>

              {/* Two ways out. The printable page is the one that renders
                  Persian correctly, because the browser does the typesetting;
                  the PDF is one click but its word order is not trustworthy
                  for wrapping Persian text. */}
              <Button
                variant="contained"
                disabled={!hasIncome}
                component="a"
                href={printHref}
                target="_blank"
                rel="noopener"
                endIcon={<OpenInNewRoundedIcon />}
                fullWidth
              >
                <Trans>Open printable document</Trans>
              </Button>

              <Button variant="outlined" disabled={!hasIncome || isPending || !model} onClick={() => download()} fullWidth>
                {isPending ? t`Generating…` : t`Download PDF`}
              </Button>

              {model?.incomplete ? (
                <Alert severity="warning">
                  <Trans>
                    Your name is not set yet. Without personal details this document carries no weight with an embassy or a landlord —{' '}
                    <RouterLink to="/settings">fill it in from Settings</RouterLink>.
                  </Trans>
                </Alert>
              ) : null}
            </Stack>
          </SurfaceCard>
        </Grid>
      </Grid>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
    </Box>
  )
}
