import { useLingui } from '@lingui/react/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { ChartCard } from 'src/shared/chart-card'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from 'src/shared/insight-callout'
import { PageActions, useReportYear } from 'src/shared/page-actions'
import { PageHeader } from 'src/shared/page-header'
import {
  getClientSharesQuery,
  getClientSharesQueryKey,
  getMonthlyTotalsQuery,
  getMonthlyTotalsQueryKey,
  getPopulatedYearsQuery,
  getPopulatedYearsQueryKey,
} from 'src/shared/queries'
import { SurfaceCard } from 'src/shared/surface-card'
import { TopCustomers } from 'src/shared/top-customers'
import { yearRange } from 'src/shared/utils'
import { ClientShareChart } from './ClientShareChart'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

/**
 * Scenario 4, laid out to the design's `Charts/Desktop/RTL`: a full-width bar
 * chart, then two equal columns, the donut with its insight callout beneath,
 * beside the ranked client list.
 */
export const ChartsPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const { digits } = useFormat()
  const [year, setYear] = useReportYear(calendar)

  const { data: years = [] } = useQuery({
    queryKey: getPopulatedYearsQueryKey(calendar),
    queryFn: getPopulatedYearsQuery,
  })

  const monthly = useQuery({
    queryKey: getMonthlyTotalsQueryKey(year, calendar),
    queryFn: getMonthlyTotalsQuery,
  })

  const clientShares = useQuery({
    queryKey: getClientSharesQueryKey(yearRange(year, calendar)),
    queryFn: getClientSharesQuery,
  })

  const months = monthly.data
  const shareData = clientShares.data

  const yearTotal = months?.reduce((sum, month) => sum + month.totalToman, 0) ?? 0
  const hasData = yearTotal > 0

  // A read that failed is not a year with nothing in it. Falling through to the
  // empty state would tell a user with three years of receipts to record their
  // first one, and a Dexie failure, a blocked upgrade, a full quota, private
  // browsing, is exactly the case where that is most alarming.
  //
  // Either query failing takes the whole page, because both halves describe the
  // same year: a page that drew the bars but silently lost the concentration
  // warning would be advice about the user's livelihood, minus the warning.
  const failed = monthly.isError || clientShares.isError
  const retry = () => {
    void monthly.refetch()
    void clientShares.refetch()
  }

  return (
    <Box>
      <PageHeader
        title={t`Charts`}
        subtitle={t`A one-year picture of your income`}
        action={<PageActions year={year} years={years} onYearChange={setYear} formatYear={digits} />}
      />

      {failed ? (
        <SurfaceCard>
          <EmptyState
            icon={<ErrorOutlineRoundedIcon />}
            title={t`The charts could not be loaded`}
            description={t`Your data is safe and has not been erased. Try again.`}
            actionLabel={t`Try again`}
            onAction={retry}
          />
        </SurfaceCard>
      ) : monthly.isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          {/* `role="progressbar"` with no text inside it has no accessible
              name of its own (axe `aria-progressbar-name`). */}
          <CircularProgress aria-label={t`Loading`} />
        </Box>
      ) : !hasData ? (
        <SurfaceCard>
          <EmptyState
            icon={<BarChartRoundedIcon />}
            title={t`No data for this year yet`}
            description={t`Once you record a few receipts, this shows how your income rose and fell month by month, and how much of it depends on a single client.`}
            actionLabel={t`Record a receipt`}
            onAction={() => navigate('/quick-entry')}
          />
        </SurfaceCard>
      ) : (
        <Stack spacing={3}>
          <ChartCard title={t`Income for ${digits(year)} (millions of Toman)`}>
            <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
          </ChartCard>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ChartCard title={t`Top clients`}>
                {(shareData?.shares.length ?? 0) > 0 ? (
                  <TopCustomers shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                ) : (
                  <Typography sx={{ color: 'text.secondary' }} variant="body2">
                    {t`Nothing recorded in this range yet.`}
                  </Typography>
                )}
              </ChartCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                {/* The year is named rather than called "this year": the header's
                    picker reaches back over every populated year, and the bar
                    chart above already spells its year into the title. */}
                <ChartCard title={t`Client share of income`} subtitle={t`Based on the income recorded in ${digits(year)}`}>
                  <ClientShareChart shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                </ChartCard>

                {shareData?.insight ? (
                  <InsightCallout message={t`${digits(shareData.insight.percentage)}% of your income comes from a single client.`} />
                ) : null}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
