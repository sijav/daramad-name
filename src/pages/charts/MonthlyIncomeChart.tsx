import { useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { CalendarSystem, MonthlyTotal } from 'src/shared/types'
import { formatNumberPersian, monthNames, toPersianDigits } from 'src/shared/utils'

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
  const theme = useTheme()
  const labels = monthNames(calendar)

  return (
    <BarChart
      height={320}
      series={[
        {
          data: months.map((month) => month.totalToman),
          label: 'درآمد ماهانه',
          color: theme.palette.primary.main,
          valueFormatter: (value) => (value === null ? '—' : `${formatNumberPersian(value)} تومان`),
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
          valueFormatter: (value: number) => toPersianDigits(Math.round(value / 1_000_000).toString()),
        },
      ]}
      margin={{ right: 16 }}
      grid={{ horizontal: true }}
    />
  )
}
