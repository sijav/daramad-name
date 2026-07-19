import { Trans, useLingui } from '@lingui/react/macro'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { loadReportI18n } from 'src/core/i18n'
import { useSettings } from 'src/core/query'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { GlassCard } from 'src/shared/glass-card'
import { PageHeader } from 'src/shared/page-header'
import { buildIncomeReport, loadPdfMake, type ReportLanguage } from 'src/shared/pdf'
import { getIncomeReportQuery, getIncomeReportQueryKey, getPopulatedYearsQuery, getPopulatedYearsQueryKey } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { StatTile } from 'src/shared/stat-tile'
import { monthNames, yearOf, yearRange } from 'src/shared/utils'

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
      <PageHeader title={t`Income report`} subtitle={t`A document you can hand to an embassy, a landlord or an accountant`} />

      <Stack spacing={3}>
        <GlassCard>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' } }}>
            <TextField
              select
              label={t`Report year`}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              sx={{ minWidth: 160 }}
            >
              {years.map((option) => (
                <MenuItem key={option} value={option}>
                  {digits(option)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                <Trans>Document language</Trans>
              </Typography>
              <SegmentedControl<ReportLanguage>
                value={language}
                options={[
                  { value: 'fa', label: t`Persian` },
                  { value: 'en', label: t`English` },
                ]}
                onValueChange={setLanguage}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              disabled={!hasIncome || isPending}
              onClick={() => download()}
              sx={{ minWidth: 200 }}
            >
              {isPending ? t`Generating…` : t`Download PDF`}
            </Button>
          </Stack>

          {profileMissing ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Trans>
                Your name is not set yet. Without personal details this document carries no weight with an embassy or a landlord —{' '}
                <RouterLink to="/settings">fill it in from Settings</RouterLink>.
              </Trans>
            </Alert>
          ) : null}
        </GlassCard>

        {isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !hasIncome ? (
          <GlassCard>
            <EmptyState
              icon={<DescriptionRoundedIcon />}
              title={t`No receipts recorded for this year`}
              description={t`The income report is built from the receipts you record. Add a few receipts first, then produce the document here.`}
            />
          </GlassCard>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatTile label={t`Total income`} value={report?.totalToman ?? 0} emphasis />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatTile
                  label={t`Average monthly income`}
                  value={report?.monthlyAverageToman ?? 0}
                  hint={t`Divided by the months in the range, not only the months with income`}
                />
              </Grid>
            </Grid>

            <GlassCard>
              <Typography variant="h3" sx={{ mb: 0.5 }}>
                <Trans>Document preview</Trans>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                <Trans>
                  {dateLong(range.from)} to {dateLong(range.to)}
                </Trans>
              </Typography>

              <Stack spacing={1}>
                {report?.months.map((month) => (
                  <Stack
                    key={`${month.year}-${month.month}`}
                    direction="row"
                    sx={(theme) => ({
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                    })}
                  >
                    <Typography variant="body2">{monthNames(calendar, i18n)[month.month - 1]}</Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {`${number(month.totalToman)} ${i18n._(CURRENCY_LABELS.TOMAN)}`}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </GlassCard>
          </>
        )}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
    </Box>
  )
}
