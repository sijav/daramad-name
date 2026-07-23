import { Trans, useLingui } from '@lingui/react/macro'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { Box, Button, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { radius } from 'src/core/theme'
import { ClientShareChart, MonthlyIncomeChart } from 'src/pages/charts'
import { ChartCard } from 'src/shared/chart-card'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from 'src/shared/insight-callout'
import { PageActions, useReportYear } from 'src/shared/page-actions'
import { PageHeader } from 'src/shared/page-header'
import {
  getClientSharesQuery,
  getClientSharesQueryKey,
  getLedgerQuery,
  getLedgerQueryKey,
  getMonthlyTotalsQuery,
  getMonthlyTotalsQueryKey,
  getPopulatedYearsQuery,
  getPopulatedYearsQueryKey,
} from 'src/shared/queries'
import { SummaryCard } from 'src/shared/summary-card'
import { SurfaceCard } from 'src/shared/surface-card'
import { averagingPeriod, monthIndexOf, monthNames, yearOf, yearRange } from 'src/shared/utils'
import { RecentReceipts } from './RecentReceipts'

/**
 * «نمای کلی» — the landing page added in the redesign.
 *
 * It answers the three questions a freelancer opens the tool with (how much
 * this year, where did it come from, what came in recently) and then points at
 * the report, which is the thing they actually need a document for.
 */
export const DashboardPage = () => {
  const { t, i18n } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const { digits } = useFormat()
  // `useReportYear` rather than a local `useState`, so the picked year is
  // re-expressed when Settings switches calendar system instead of holding a
  // Jalali number against a list of Gregorian options.
  const [year, setYear] = useReportYear(calendar)

  const range = yearRange(year, calendar)
  // One rule for every monthly average in the app: divide by the months of the
  // period on screen, never counting past today. A year still in progress must
  // not be divided by 12.
  const averagingMonths = averagingPeriod(range, calendar).months

  const { data: years = [] } = useQuery({ queryKey: getPopulatedYearsQueryKey(calendar), queryFn: getPopulatedYearsQuery })
  const { data: months, isLoading } = useQuery({ queryKey: getMonthlyTotalsQueryKey(year, calendar), queryFn: getMonthlyTotalsQuery })
  const { data: shareData } = useQuery({ queryKey: getClientSharesQueryKey(range), queryFn: getClientSharesQuery })
  const { data: ledger } = useQuery({
    queryKey: getLedgerQueryKey({ range }, { field: 'occurredAt', direction: 'desc' }, calendar),
    queryFn: getLedgerQuery,
  })

  // Sum the SAME months the average divides by.
  //
  // Summing all twelve buckets while dividing by the clamped count inflates the
  // average by however much sits in months that have not happened — the exact
  // defect `getLedger.query.ts` records having fixed twice. Future-dated
  // receipts are reachable (the form allows any date), so this is not
  // hypothetical.
  const lastCountedMonth =
    yearOf(new Date(averagingPeriod(range, calendar).range.to), calendar) === year
      ? monthIndexOf(new Date(averagingPeriod(range, calendar).range.to), calendar) + 1
      : 12
  const countedMonths = months?.filter((month) => month.month <= lastCountedMonth) ?? []
  const yearTotal = countedMonths.reduce((sum, month) => sum + month.totalToman, 0)
  const receiptCount = countedMonths.reduce((sum, month) => sum + month.receiptCount, 0)
  // The design's fourth card is the CURRENT month, not a count of active ones.
  //
  // The bucket comes out of whichever year is picked, so on a past year it is
  // that year's Mordad rather than this one. The label says so instead — a
  // figure headed "this month" that is not this month is exactly the number
  // someone copies onto a form. The neighbouring cards already name their year.
  const currentMonth = monthIndexOf(new Date(), calendar) + 1
  const monthTotal = months?.find((month) => month.month === currentMonth)?.totalToman ?? 0
  const monthLabel =
    year === yearOf(new Date(), calendar)
      ? t`Income this month`
      : t`Income in ${monthNames(calendar, i18n)[currentMonth - 1]} ${digits(year)}`
  const hasData = yearTotal > 0

  return (
    <Box>
      <PageHeader
        title={t`Income overview`}
        subtitle={t`A summary of the income and receipts recorded in ${digits(year)}`}
        action={<PageActions year={year} years={years} onYearChange={setYear} formatYear={digits} />}
      />

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          {/* `role="progressbar"` with no text inside it has no accessible
              name of its own (axe `aria-progressbar-name`). */}
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      ) : !hasData ? (
        <SurfaceCard>
          <EmptyState
            icon={<DescriptionRoundedIcon />}
            title={t`No income recorded for this year yet`}
            description={t`Record a few receipts and this page will show your year at a glance — month by month, and which clients it came from.`}
            actionLabel={t`Record a receipt`}
            onAction={() => navigate('/quick-entry')}
          />
        </SurfaceCard>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={monthLabel} value={monthTotal} icon={<EventAvailableRoundedIcon />} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Income in ${digits(year)}`} value={yearTotal} icon={<PaymentsRoundedIcon />} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard
                label={t`Monthly average`}
                value={Math.round(yearTotal / averagingMonths)}
                hint={t`divided by ${digits(averagingMonths)} months`}
                icon={<ShowChartRoundedIcon />}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Receipts in ${digits(year)}`} value={digits(receiptCount)} icon={<ReceiptLongRoundedIcon />} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack sx={{ height: '100%' }}>
                <ChartCard variant="content" title={t`Client share of income`} subtitle={t`Based on the income recorded this year`}>
                  {/* The design keeps this callout inside the share card, not
                      as a full-width band beneath the row, and pins it to the
                      bottom so it lines up when the row grows. */}
                  <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
                    <ClientShareChart shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                    {shareData?.insight ? (
                      <InsightCallout message={t`${digits(shareData.insight.percentage)}% of your income comes from a single client.`} />
                    ) : null}
                  </Stack>
                </ChartCard>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartCard variant="content" title={t`Income by month`}>
                <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
              </ChartCard>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                {/* The design's `Report Shortcut`: a tinted panel rather than a
                    plain card, aligned to the reading direction with a filled
                    brand tile for the icon. */}
                <SurfaceCard tone="subtle" flat>
                  <Stack spacing={2} sx={{ alignItems: 'flex-start', textAlign: 'start' }}>
                    <Box
                      sx={(theme) => ({
                        display: 'grid',
                        placeItems: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: `${radius.lg}px`,
                        backgroundColor: theme.palette.brandPrimary,
                        color: theme.palette.common.white,
                        '& svg': { fontSize: 28 },
                      })}
                    >
                      <DescriptionRoundedIcon />
                    </Box>
                    <Typography variant="h3">
                      <Trans>An income report ready to present</Trans>
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }} variant="body2">
                      <Trans>Produce an official income document for any range, in Persian or English.</Trans>
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/report')}>
                      <Trans>Create report</Trans>
                    </Button>
                  </Stack>
                </SurfaceCard>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ChartCard
                variant="content"
                title={t`Latest receipts`}
                action={
                  <Button size="small" variant="text" onClick={() => navigate('/ledger')}>
                    <Trans>View all</Trans>
                  </Button>
                }
              >
                <RecentReceipts receipts={(ledger?.receipts ?? []).slice(0, 6)} calendar={calendar} />
              </ChartCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
