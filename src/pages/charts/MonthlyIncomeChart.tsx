import { useLingui } from '@lingui/react/macro'
import { useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import type { CalendarSystem, MonthlyTotal } from 'src/shared/types'
import { monthNames } from 'src/shared/utils'

export interface MonthlyIncomeChartProps {
  months: MonthlyTotal[]
  calendar: CalendarSystem
}

/**
 * The 12-month bar chart.
 *
 * Every month is plotted, including the empty ones — a month with no income
 * gets a zero bar rather than disappearing. Dropping it would compress the axis
 * and quietly hide the gap, which is exactly the thing a freelancer needs to
 * see (scenario 4's Mordad).
 */
export const MonthlyIncomeChart = ({ months, calendar }: MonthlyIncomeChartProps) => {
  const { t, i18n } = useLingui()
  const { number, digits } = useFormat()
  const theme = useTheme()
  const labels = monthNames(calendar, i18n)
  const toman = i18n._(CURRENCY_LABELS.TOMAN)

  return (
    <BarChart
      height={320}
      series={[
        {
          data: months.map((month) => month.totalToman),
          label: t`Monthly income`,
          color: theme.palette.primary.main,
          valueFormatter: (value) => (value === null ? '—' : `${number(value)} ${toman}`),
        },
      ]}
      xAxis={[
        {
          data: months.map((month) => labels[month.month - 1]),
          scaleType: 'band',
        },
      ]}
      yAxis={[
        {
          // Millions, so the axis stays readable instead of printing nine digits.
          valueFormatter: (value: number) => digits(Math.round(value / 1_000_000)),
        },
      ]}
      margin={{ right: 16 }}
      grid={{ horizontal: true }}
    />
  )
}
