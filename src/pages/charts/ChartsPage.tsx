import { useLingui } from '@lingui/react/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import { Box, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { ChartCard } from 'src/shared/chart-card'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from 'src/shared/insight-callout'
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
import { Tag } from 'src/shared/tag'
import { TopCustomers } from 'src/shared/top-customers'
import { yearOf, yearRange } from 'src/shared/utils'
import { ClientShareChart } from './ClientShareChart'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

/**
 * Scenario 4, laid out to the design's `Charts/Desktop/RTL`: a full-width bar
 * chart, then two equal columns — the donut with its insight callout beneath,
 * beside the ranked client list.
 */
export const ChartsPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const { digits } = useFormat()
  const [year, setYear] = useState(() => yearOf(new Date(), calendar))

  const { data: years = [] } = useQuery({
    queryKey: getPopulatedYearsQueryKey(calendar),
    queryFn: getPopulatedYearsQuery,
  })

  const { data: months, isLoading } = useQuery({
    queryKey: getMonthlyTotalsQueryKey(year, calendar),
    queryFn: getMonthlyTotalsQuery,
  })

  const { data: shareData } = useQuery({
    queryKey: getClientSharesQueryKey(yearRange(year, calendar)),
    queryFn: getClientSharesQuery,
  })

  const yearTotal = months?.reduce((sum, month) => sum + month.totalToman, 0) ?? 0
  const hasData = yearTotal > 0

  return (
    <Box>
      <PageHeader
        title={t`Charts`}
        subtitle={t`A one-year picture of your income`}
        action={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Tag icon={<CalendarMonthRoundedIcon sx={{ fontSize: 15 }} />} label={t`Report range: ${digits(year)}`} />
            <TextField select size="small" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ minWidth: 118 }}>
              {years.map((option) => (
                <MenuItem key={option} value={option}>
                  {digits(option)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress />
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
          <ChartCard title={t`Income for ${digits(year)}`} subtitle={t`Vertical axis figures are in millions of Toman.`}>
            <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
          </ChartCard>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <ChartCard title={t`Client share of income`} subtitle={t`Based on the income recorded this year`}>
                  <ClientShareChart shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                </ChartCard>

                {shareData?.insight ? (
                  <InsightCallout message={t`${digits(shareData.insight.percentage)}% of your income comes from a single client.`} />
                ) : null}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <ChartCard title={t`Top clients`}>
                {(shareData?.shares.length ?? 0) > 0 ? (
                  <TopCustomers shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t`Nothing recorded in this range yet.`}
                  </Typography>
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
