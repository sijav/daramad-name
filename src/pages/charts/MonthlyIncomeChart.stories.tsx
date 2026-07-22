import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { MonthlyTotal } from 'src/shared/types'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

// `role-img-alt` is switched off HERE ONLY, and it is upstream rather than ours.
//
// MUI X renders `ChartsAccessibilityProxy`: two `role="img"` divs pointing at
// `voiceover-<chartId>-1|2` elements that the library creates EMPTY and fills
// only while the chart has keyboard focus. It is a live-region proxy for
// keyboard navigation, not a static image label — so at rest axe correctly sees
// `role="img"` with an empty name, on every chart, in every story.
//
// The only ways to satisfy the rule are to pass `disableKeyboardNavigation`,
// which removes a real accessibility feature to please a checker, or to write
// into MUI X's internal divs. Both are worse than the finding. Every other axe
// rule stays enforced. SEE TECH-DEBT.md.
const CHART_A11Y = { a11y: { config: { rules: [{ id: 'role-img-alt', enabled: false }] } } }

const meta = {
  title: 'Pages/Charts/MonthlyIncomeChart',
  component: MonthlyIncomeChart,
  parameters: { ...CHART_A11Y },
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
    <SurfaceCard>
      <MonthlyIncomeChart {...args} />
    </SurfaceCard>
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
