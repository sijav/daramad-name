import { Trans, useLingui } from '@lingui/react/macro'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import { Box, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { EmptyState } from 'src/shared/empty-state'
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
import { toPersianDigits, yearOf, yearRange } from 'src/shared/utils'
import { ClientShareChart } from './ClientShareChart'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

/** Scenario 4: the annual picture, and the dependency warning that comes with it. */
export const ChartsPage = () => {
  const { t } = useLingui()
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
        title={t`نمودارها`}
        subtitle={t`تصویر یک‌ساله‌ی درآمدت`}
        action={
          <TextField select value={year} onChange={(event) => setYear(Number(event.target.value))} label={t`سال`} sx={{ minWidth: 140 }}>
            {years.map((option) => (
              <MenuItem key={option} value={option}>
                {toPersianDigits(option)}
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
            title={t`برای این سال هنوز داده‌ای نیست`}
            description={t`وقتی چند دریافتی ثبت کنی، اینجا می‌بینی درآمدت ماه‌به‌ماه چطور بالا و پایین شده و چقدرش به یک مشتری وابسته است.`}
            actionLabel={t`ثبت دریافتی`}
            onAction={() => navigate('/')}
          />
        </GlassCard>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatTile label={t`درآمد سال ${toPersianDigits(year)}`} value={yearTotal} emphasis />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatTile label={t`میانگین ماهانه`} value={Math.round(yearTotal / 12)} hint={t`تقسیم بر ۱۲ ماه سال`} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatTile label={t`ماه‌های دارای درآمد`} value={t`${toPersianDigits(activeMonths)} از ۱۲`} />
            </Grid>
          </Grid>

          <GlassCard>
            <Typography variant="h3" sx={{ mb: 2 }}>
              <Trans>درآمد ۱۲ ماه</Trans>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <Trans>ارقام محور عمودی به میلیون تومان است.</Trans>
            </Typography>
            <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
          </GlassCard>

          <GlassCard>
            <Typography variant="h3" sx={{ mb: 2 }}>
              <Trans>سهم مشتری‌ها</Trans>
            </Typography>
            <ClientShareChart shares={shareData?.shares ?? []} />
            {shareData?.insight ? (
              <InsightBanner
                sx={{ mt: 2 }}
                message={t`${toPersianDigits(shareData.insight.percentage)}٪ درآمدت از یک مشتری است («${shareData.insight.clientName}»). اگر این مشتری برود، بخش بزرگی از درآمدت می‌رود.`}
              />
            ) : null}
          </GlassCard>
        </Stack>
      )}
    </Box>
  )
}
