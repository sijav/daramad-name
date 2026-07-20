import { Trans, useLingui } from '@lingui/react/macro'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { Alert, Box, Button, CircularProgress, Divider, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { loadReportI18n } from 'src/core/i18n'
import { useSettings } from 'src/core/query'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { PageActions } from 'src/shared/page-actions'
import { PageHeader } from 'src/shared/page-header'
import { buildIncomeReport, loadPdfMake, type ReportLanguage } from 'src/shared/pdf'
import { getIncomeReportQuery, getIncomeReportQueryKey, getPopulatedYearsQuery, getPopulatedYearsQueryKey } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { StatTile } from 'src/shared/stat-tile'
import { SurfaceCard } from 'src/shared/surface-card'
import { monthNames, yearOf, yearRange } from 'src/shared/utils'
import { DocumentRow } from './DocumentRow'

/** Scenario 3: a presentable income certificate, in Persian or English. */
export const ReportPage = () => {
  const { t, i18n } = useLingui()
  const { digits, number, dateLong } = useFormat()
  const { calendar, profile } = useSettings()
  const [year, setYear] = useState(() => yearOf(new Date(), calendar))
  const [language, setLanguage] = useState<ReportLanguage>('fa')
  const [error, setError] = useState<string | null>(null)

  const range = yearRange(year, calendar)

  const { data: years = [] } = useQuery({
    queryKey: getPopulatedYearsQueryKey(calendar),
    queryFn: getPopulatedYearsQuery,
  })

  const { data: report, isLoading } = useQuery({
    queryKey: getIncomeReportQueryKey(range, calendar),
    queryFn: getIncomeReportQuery,
  })

  const { mutate: download, isPending } = useMutation({
    mutationFn: async () => {
      if (!report) {
        return
      }
      // A dedicated i18n instance for the document, so an English certificate
      // can be produced without flipping the interface locale underneath the user.
      const [pdfMake, reportI18n] = await Promise.all([loadPdfMake(), loadReportI18n(language === 'fa' ? 'fa-IR' : 'en-US')])
      const definition = buildIncomeReport(report, language, calendar, reportI18n)
      pdfMake.createPdf(definition).download(`income-report-${year}-${language}.pdf`)
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const profileMissing = !profile.fullName.trim()
  const hasIncome = (report?.totalToman ?? 0) > 0

  return (
    <Box>
      <PageHeader
        title={t`Income report`}
        subtitle={t`A document you can hand to an embassy, a landlord or an accountant`}
        action={<PageActions year={year} years={years} onYearChange={setYear} formatYear={digits} />}
      />

      {/* The design's report row: the document leads on the reading side, the
          configuration panel sits beside it in a fixed 340px column. */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
              <CircularProgress />
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
              <Stack spacing={0.5}>
                <Typography variant="h2">
                  <Trans>Certificate of income</Trans>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Trans>Issued by Daramadname — a personal record of freelance income</Trans>
                </Typography>
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <DocumentRow label={t`Name`} value={profile.fullName.trim() || '—'} />
                <DocumentRow label={t`Range`} value={`${dateLong(range.from)} – ${dateLong(range.to)}`} />
                <DocumentRow label={t`Issued on`} value={dateLong(new Date().toISOString())} />
              </Stack>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatTile label={t`Total income`} value={report?.totalToman ?? 0} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatTile label={t`Average monthly income`} value={report?.monthlyAverageToman ?? 0} />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                <Trans>Month by month</Trans>
              </Typography>

              {/* Striped rather than ruled, matching the document in the design. */}
              <Stack>
                {report?.months.map((month, index) => (
                  <Stack
                    key={`${month.year}-${month.month}`}
                    direction="row"
                    sx={(theme) => ({
                      justifyContent: 'space-between',
                      px: 1.75,
                      py: 1.25,
                      backgroundColor: index % 2 === 0 ? theme.palette.surfaceSubtle : 'transparent',
                    })}
                  >
                    <Typography variant="body2">{monthNames(calendar, i18n)[month.month - 1]}</Typography>
                    <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {`${number(month.totalToman)} ${i18n._(CURRENCY_LABELS.TOMAN)}`}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                <Trans>This document is generated from the data you recorded in Daramadname and is informational.</Trans>
              </Typography>
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
                <Typography variant="caption" color="text.secondary">
                  <Trans>Range</Trans>
                </Typography>
                <TextField select size="small" value={year} onChange={(event) => setYear(Number(event.target.value))} fullWidth>
                  {years.map((option) => (
                    <MenuItem key={option} value={option}>
                      {digits(option)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
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

              <Button variant="contained" disabled={!hasIncome || isPending} onClick={() => download()} fullWidth>
                {isPending ? t`Generating…` : t`Download PDF`}
              </Button>

              {profileMissing ? (
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
