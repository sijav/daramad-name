import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import type { MonthlyTotal } from 'src/shared/types'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

const meta = {
  title: 'Pages/Charts/MonthlyIncomeChart',
  component: MonthlyIncomeChart,
} satisfies Meta<typeof MonthlyIncomeChart>

export default meta
type Story = StoryObj<typeof meta>

const months = (values: number[]): MonthlyTotal[] =>
  values.map((totalToman, index) => ({ month: index + 1, year: 1405, totalToman, receiptCount: totalToman > 0 ? 1 : 0 }))

/**
 * Every month is plotted, including the empty ones. Mordad here is a zero bar,
 * not a missing column — dropping empty months would compress the axis and hide
 * exactly the gap a freelancer needs to see.
 */
export const WithEmptyMonths: Story = {
  args: {
    calendar: 'JALALI',
    months: months([22000000, 107940000, 124940000, 67250000, 0, 0, 0, 15000000, 0, 12000000, 52380000, 0]),
  },
  render: (args) => (
    <GlassCard>
      <MonthlyIncomeChart {...args} />
    </GlassCard>
  ),
}

/** A year with income every month. */
export const FullYear: Story = {
  ...WithEmptyMonths,
  args: {
    calendar: 'JALALI',
    months: months([22, 108, 125, 67, 40, 55, 33, 15, 90, 12, 52, 70].map((m) => m * 1_000_000)),
  },
}

/** The first-month case: a single bar must not blow out the axis. */
export const SingleMonth: Story = {
  ...WithEmptyMonths,
  args: { calendar: 'JALALI', months: months([18000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
}

export const Gregorian: Story = {
  ...WithEmptyMonths,
  args: {
    calendar: 'GREGORIAN',
    months: months([22000000, 107940000, 124940000, 67250000, 0, 0, 0, 15000000, 0, 12000000, 52380000, 0]),
  },
}
