import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { MonthlyTotal } from 'src/shared/types'
import { expect, within } from 'storybook/test'
import { MonthlyIncomeChart } from './MonthlyIncomeChart'

// NO `role-img-alt` suppression here, unlike the other four chart story files.
//
// Theirs is about MUI X's `ChartsAccessibilityProxy`, whose `role="img"` divs
// are empty at rest. This chart contains no MUI X at all — it is plain boxes,
// and the only `role="img"` on the page is the one this component puts on each
// bar, deliberately paired with the `aria-label` that makes the label legal.
// Copying the suppression here would switch off the one automated check that
// the bars keep their names.

const meta = {
  title: 'Pages/Charts/MonthlyIncomeChart',
  component: MonthlyIncomeChart,
  argTypes: {
    months: { description: 'All twelve buckets, including the empty ones — a missing month would hide the gap.' },
    calendar: { description: 'Names the months. A Jalali year starts at Farvardin, a Gregorian one at January.' },
  },
} satisfies Meta<typeof MonthlyIncomeChart>

export default meta
type Story = StoryObj<typeof meta>

const months = (values: number[]): MonthlyTotal[] =>
  values.map((totalToman, index) => ({ month: index + 1, year: 1405, totalToman, receiptCount: totalToman > 0 ? 1 : 0 }))

const PATCHY = months([22000000, 107940000, 124940000, 67250000, 0, 0, 0, 15000000, 0, 12000000, 52380000, 0])

// Named rather than spread from a sibling story: spreading a whole story object
// carries its `play` along with its `render`, and a play written for one set of
// months silently runs against the next.
const inCard: Story['render'] = (args) => (
  <SurfaceCard>
    <MonthlyIncomeChart {...args} />
  </SurfaceCard>
)

/**
 * Every month is plotted, including the empty ones. Mordad here is a zero bar,
 * not a missing column — dropping empty months would compress the axis and hide
 * exactly the gap a freelancer needs to see.
 *
 * The bars are the only text alternative the chart has, so they are read here
 * rather than looked at: twelve of them, each named, and the quiet ones saying
 * they are quiet instead of announcing a bare zero.
 */
export const WithEmptyMonths: Story = {
  args: { calendar: 'JALALI', months: PATCHY },
  render: inCard,
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const bars = await canvas.findAllByRole('img')
    await expect(bars).toHaveLength(12)

    await expect(await canvas.findByRole('img', { name: 'مرداد ۱۴۰۵: بدون درآمد ثبت‌شده' })).toBeInTheDocument()
    await expect(await canvas.findByRole('img', { name: 'فروردین ۱۴۰۵: ۲۲٬۰۰۰٬۰۰۰ تومان' })).toBeInTheDocument()

    // A time axis runs left to right in both scripts. In RTL the first child
    // lands rightmost, so Esfand leads the DOM order and Farvardin closes it.
    await expect(bars[0]).toHaveAccessibleName(/^اسفند ۱۴۰۵/)
    await expect(bars[11]).toHaveAccessibleName(/^فروردین ۱۴۰۵/)
  },
}

/**
 * The same year read left to right. The DOM order flips with it — which is the
 * point: the reversal is done in the markup, not with `direction: ltr`, because
 * the stylis RTL plugin would mirror that straight back.
 */
export const LeftToRight: Story = {
  args: { calendar: 'JALALI', months: PATCHY },
  render: inCard,
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const bars = await within(canvasElement).findAllByRole('img')

    await expect(bars).toHaveLength(12)
    await expect(bars[0]).toHaveAccessibleName(/^Farvardin 1405/)
    await expect(bars[11]).toHaveAccessibleName(/^Esfand 1405/)
  },
}

/** A year with income every month. */
export const FullYear: Story = {
  args: { calendar: 'JALALI', months: months([22, 108, 125, 67, 40, 55, 33, 15, 90, 12, 52, 70].map((m) => m * 1_000_000)) },
  render: inCard,
}

/** The first-month case: a single bar must not blow out the axis. */
export const SingleMonth: Story = {
  args: { calendar: 'JALALI', months: months([18000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  render: inCard,
}

export const Gregorian: Story = {
  args: { calendar: 'GREGORIAN', months: PATCHY },
  render: inCard,
}
