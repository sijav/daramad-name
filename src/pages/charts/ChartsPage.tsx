import { Trans, useLingui } from '@lingui/react/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import { Box, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { GlassCard } from 'src/shared/glass-card'
import { InsightBanner } from 'src/shared/insight-banner'
import { PageHeader } from 'src/shared/page-header'
import {
  getClientSharesQuery,
  getClientSharesQueryKey,
  getMonthlyTotalsQuery,
  getMonthlyTotalsQueryKey,
  getPopulatedYearsQuery,
  getPopulatedYearsQueryKey,
} from 'src/shared/queries'
import { StatTile } from 'src/shared/stat-tile'
import { yearOf, yearRange } from 'src/shared/utils'
import { ClientShareChart } from './ClientShareChart'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

/** Scenario 4: the annual picture, and the dependency warning that comes with it. */
export const ChartsPage = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  const navigate = useNavigate()
  const { calendar } = useSettings()
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
  const activeMonths = months?.filter((month) => month.totalToman > 0).length ?? 0
  const hasData = yearTotal > 0

  return (
    <Box>
      <PageHeader
        title={t`Charts`}
        subtitle={t`A one-year picture of your income`}
        action={
          <TextField select value={year} onChange={(event) => setYear(Number(event.target.value))} label={t`Year`} sx={{ minWidth: 140 }}>
            {years.map((option) => (
              <MenuItem key={option} value={option}>
                {digits(option)}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : !hasData ? (
        <GlassCard>
          <EmptyState
            icon={<BarChartRoundedIcon />}
            title={t`No data for this year yet`}
            description={t`Once you record a few receipts, this shows how your income rose and fell month by month, and how much of it depends on a single client.`}
            actionLabel={t`Record a receipt`}
            onAction={() => navigate('/')}
          />
        </GlassCard>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatTile label={t`Income for ${digits(year)}`} value={yearTotal} emphasis />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatTile label={t`Monthly average`} value={Math.round(yearTotal / 12)} hint={t`Divided by the 12 months of the year`} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatTile label={t`Months with income`} value={t`${digits(activeMonths)} of 12`} />
            </Grid>
          </Grid>

          <GlassCard>
            <Typography variant="h3" sx={{ mb: 2 }}>
              <Trans>Income over 12 months</Trans>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <Trans>Vertical axis figures are in millions of Toman.</Trans>
            </Typography>
            <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
          </GlassCard>

          <GlassCard>
            <Typography variant="h3" sx={{ mb: 2 }}>
              <Trans>Client share</Trans>
            </Typography>
            <ClientShareChart shares={shareData?.shares ?? []} />
            {shareData?.insight ? (
              <InsightBanner
                sx={{ mt: 2 }}
                message={t`${digits(shareData.insight.percentage)}% of your income comes from one client (“${shareData.insight.clientName}”). If they leave, a large part of your income goes with them.`}
              />
            ) : null}
          </GlassCard>
        </Stack>
      )}
    </Box>
  )
}
