import { Trans, useLingui } from '@lingui/react/macro'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { Box, Button, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'src/core/query'
import { ClientShareChart, MonthlyIncomeChart } from 'src/pages/charts'
import { EmptyState } from 'src/shared/empty-state'
import { useFormat } from 'src/shared/format'
import { GlassCard } from 'src/shared/glass-card'
import { InsightCallout } from 'src/shared/insight-callout'
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
import { Tag } from 'src/shared/tag'
import { TopCustomers } from 'src/shared/top-customers'
import { yearOf, yearRange } from 'src/shared/utils'
import { RecentReceipts } from './RecentReceipts'

/**
 * «نمای کلی» — the landing page added in the redesign.
 *
 * It answers the three questions a freelancer opens the tool with (how much
 * this year, where did it come from, what came in recently) and then points at
 * the report, which is the thing they actually need a document for.
 */
export const DashboardPage = () => {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { calendar } = useSettings()
  const { digits } = useFormat()
  const [year, setYear] = useState(() => yearOf(new Date(), calendar))

  const range = yearRange(year, calendar)

  const { data: years = [] } = useQuery({ queryKey: getPopulatedYearsQueryKey(calendar), queryFn: getPopulatedYearsQuery })
  const { data: months, isLoading } = useQuery({ queryKey: getMonthlyTotalsQueryKey(year, calendar), queryFn: getMonthlyTotalsQuery })
  const { data: shareData } = useQuery({ queryKey: getClientSharesQueryKey(range), queryFn: getClientSharesQuery })
  const { data: ledger } = useQuery({
    queryKey: getLedgerQueryKey({ range }, { field: 'occurredAt', direction: 'desc' }, calendar),
    queryFn: getLedgerQuery,
  })

  const yearTotal = months?.reduce((sum, month) => sum + month.totalToman, 0) ?? 0
  const activeMonths = months?.filter((month) => month.totalToman > 0).length ?? 0
  const clientCount = shareData?.shares.filter((share) => share.totalToman > 0).length ?? 0
  const hasData = yearTotal > 0

  return (
    <Box>
      <PageHeader
        title={t`Income overview`}
        subtitle={t`A summary of the income and receipts recorded in ${digits(year)}`}
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
        <GlassCard>
          <EmptyState
            icon={<DescriptionRoundedIcon />}
            title={t`No income recorded for this year yet`}
            description={t`Record a few receipts and this page will show your year at a glance — month by month, and which clients it came from.`}
            actionLabel={t`Record a receipt`}
            onAction={() => navigate('/quick-entry')}
          />
        </GlassCard>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Total income`} value={yearTotal} emphasis />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Monthly average`} value={Math.round(yearTotal / 12)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Months with income`} value={t`${digits(activeMonths)} of 12`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SummaryCard label={t`Clients`} value={digits(clientCount)} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <GlassCard sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  <Trans>Income by month</Trans>
                </Typography>
                <MonthlyIncomeChart months={months ?? []} calendar={calendar} />
              </GlassCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <GlassCard sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ mb: 0.5 }}>
                  <Trans>Client share of income</Trans>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  <Trans>Based on the income recorded this year</Trans>
                </Typography>
                <ClientShareChart shares={shareData?.shares ?? []} />
                {shareData?.insight ? (
                  <InsightCallout message={t`${digits(shareData.insight.percentage)}% of your income comes from a single client.`} />
                ) : null}
              </GlassCard>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <GlassCard sx={{ height: '100%' }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h3">
                    <Trans>Latest receipts</Trans>
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/ledger')}>
                    <Trans>Open ledger</Trans>
                  </Button>
                </Stack>
                <RecentReceipts receipts={(ledger?.receipts ?? []).slice(0, 6)} calendar={calendar} />
              </GlassCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                <GlassCard>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    <Trans>Top clients</Trans>
                  </Typography>
                  <TopCustomers shares={shareData?.shares ?? []} othersLabel={t`Others`} />
                </GlassCard>

                <GlassCard sx={{ textAlign: 'center' }}>
                  <DescriptionRoundedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                  <Typography variant="h3" sx={{ mt: 1, mb: 1 }}>
                    <Trans>An income report ready to present</Trans>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <Trans>Produce an official income document for any range, in Persian or English.</Trans>
                  </Typography>
                  <Button variant="contained" onClick={() => navigate('/report')}>
                    <Trans>Create report</Trans>
                  </Button>
                </GlassCard>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
