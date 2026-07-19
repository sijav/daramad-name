import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { EmptyState } from 'src/shared/empty-state'
import { GlassCard } from 'src/shared/glass-card'
import { PageHeader } from 'src/shared/page-header'
import { buildIncomeReport, loadPdfMake, type ReportLanguage } from 'src/shared/pdf'
import { getIncomeReportQuery, getIncomeReportQueryKey, getPopulatedYearsQuery, getPopulatedYearsQueryKey } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { StatTile } from 'src/shared/stat-tile'
import { formatDateLong, monthNames, toPersianDigits, yearOf, yearRange } from 'src/shared/utils'

/** Scenario 3: a presentable income certificate, in Persian or English. */
export const ReportPage = () => {
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
      const pdfMake = await loadPdfMake()
      const definition = buildIncomeReport(report, language, calendar)
      pdfMake.createPdf(definition).download(`income-report-${year}-${language}.pdf`)
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const profileMissing = !profile.fullName.trim()
  const hasIncome = (report?.totalToman ?? 0) > 0

  return (
    <Box>
      <PageHeader title="گزارش درآمد" subtitle="سندی که می‌تونی به سفارت، صاحبخونه یا حسابدار بدی" />

      <Stack spacing={3}>
        <GlassCard>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' } }}>
            <TextField
              select
              label="سال گزارش"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              sx={{ minWidth: 160 }}
            >
              {years.map((option) => (
                <MenuItem key={option} value={option}>
                  {toPersianDigits(option)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                زبان سند
              </Typography>
              <SegmentedControl<ReportLanguage>
                value={language}
                options={[
                  { value: 'fa', label: 'فارسی' },
                  { value: 'en', label: 'English' },
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
              {isPending ? 'در حال ساخت…' : 'دانلود PDF'}
            </Button>
          </Stack>

          {profileMissing ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              اسمت هنوز ثبت نشده. بدون مشخصات فردی، این سند برای سفارت یا صاحبخونه اعتبار نداره —{' '}
              <RouterLink to="/settings">از تنظیمات پرش کن</RouterLink>.
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
              title="برای این سال دریافتی‌ای ثبت نشده"
              description="گزارش درآمد از روی همون دریافتی‌هایی ساخته می‌شه که ثبت کردی. اول چند تا دریافتی وارد کن، بعد از همین‌جا سند بگیر."
            />
          </GlassCard>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatTile label="جمع کل درآمد" value={report?.totalToman ?? 0} emphasis />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatTile
                  label="میانگین درآمد ماهانه"
                  value={report?.monthlyAverageToman ?? 0}
                  hint="تقسیم بر تعداد ماه‌های بازه، نه فقط ماه‌های دارای درآمد"
                />
              </Grid>
            </Grid>

            <GlassCard>
              <Typography variant="h3" sx={{ mb: 0.5 }}>
                پیش‌نمایش سند
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {formatDateLong(range.from, calendar)} تا {formatDateLong(range.to, calendar)}
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
                    <Typography variant="body2">{monthNames(calendar)[month.month - 1]}</Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {toPersianDigits(month.totalToman.toLocaleString('en-US'))} تومان
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
