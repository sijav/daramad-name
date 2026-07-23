import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartCard } from 'src/shared/chart-card'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from 'src/shared/insight-callout'
import type { ClientShare } from 'src/shared/types'
import { expect, within } from 'storybook/test'
import { ClientShareChart, type ClientShareChartProps } from './ClientShareChart'

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
  title: 'Pages/Charts/ClientShareChart',
  component: ClientShareChart,
  parameters: { ...CHART_A11Y },
  argTypes: {
    othersLabel: { description: "The folded slice's name, passed in so the caller owns the wording." },
    shares: { description: 'Ranked clients. The arc order follows the array, not the values.' },
    // The fold threshold is the component's one real setting and had no control
    // and no arg on any story, so the "others" slice could not be reached from
    // the Controls panel at all.
    limit: { description: 'Rows past this fold into a single "others" slice.', control: { type: 'number', min: 1, max: 10 } },
  },
  // A literal rather than `t`, so the fold assertions read the arg itself and do
  // not depend on where the Language toolbar happens to be.
  args: { othersLabel: 'Others' },
} satisfies Meta<typeof ClientShareChart>
export default meta
type Story = StoryObj<typeof meta>

const share = (clientName: string, totalToman: number, percentage: number): ClientShare => ({
  clientId: clientName,
  clientName,
  totalToman,
  percentage,
})

const BALANCED = [
  share('Aria Trading', 120000000, 34.3),
  share('Naghsh Studio', 100000000, 28.6),
  share('Dadepardaz Co.', 80000000, 22.9),
  share('Homa Cafe', 50000000, 14.2),
]

const CONCENTRATED = [
  share('Aria Trading', 235830000, 73.2),
  share('Naghsh Studio', 54840000, 17.0),
  share('Dadepardaz Co.', 22000000, 6.8),
  share('Homa Cafe', 9500000, 3.0),
]

const FIXTURE_YEAR = 1405

const View = ({ insight, ...props }: ClientShareChartProps & { insight?: string }) => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return (
    <div style={{ maxWidth: 544 }}>
      <ChartCard title={t`Client share of income`} subtitle={t`Based on the income recorded in ${digits(FIXTURE_YEAR)}`}>
        <ClientShareChart {...props} />
      </ChartCard>
      {insight ? <div style={{ marginTop: 16 }}>{<InsightCallout message={insight} />}</div> : null}
    </div>
  )
}

const render: Story['render'] = (args) => <View {...args} />

/** Balanced book — no single client dominates, so no warning appears. */
export const Balanced: Story = { args: { shares: BALANCED }, render }

/** Above 50% the dependency warning fires; shown with the callout it explains. */
export const Concentrated: Story = {
  args: { shares: CONCENTRATED },
  render: (args) => <View {...args} insight="۷۳٪ درآمدت از یک مشتری است." />,
}

/** A single client — the extreme concentration case. */
export const SingleClient: Story = { args: { shares: [share('Aria Trading', 235830000, 100)] }, render }

/**
 * More clients than legend rows: the tail folds into one "others" slice.
 *
 * Asserted rather than described. `foldOthers` could return its input unchanged
 * and the story would still draw a donut and a legend — the only visible sign
 * would be two extra rows nobody counted.
 */
export const ManyClients: Story = {
  args: { shares: [...CONCENTRATED, share('Mr. Chen', 8000000, 2), share('Studio B', 4000000, 1)] },
  render,
  // Pinned because the percentages are read as Persian numerals below.
  globals: { locale: 'fa-IR' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // Six clients, four legend rows: three named plus the fold.
    await expect(await canvas.findByText(args.othersLabel)).toBeInTheDocument()
    await expect(canvas.queryByText('Homa Cafe')).toBeNull()
    await expect(canvas.queryByText('Studio B')).toBeNull()
    await expect(await canvas.findByText('Dadepardaz Co.')).toBeInTheDocument()

    // And the fold carries the tail's income rather than dropping it: Homa Cafe,
    // Mr. Chen and Studio B are 21,500,000 of 334,170,000, which is ۶٪.
    const percentages = (await canvas.findAllByText(/^[۰-۹]+٪$/)).map((row) => row.textContent)
    await expect(percentages).toContain('۶٪')
  },
}

/**
 * No clients at all. The dashboard passes `shares={shareData?.shares ?? []}`, so
 * this reaches the component in production — and it divides by the total, which
 * is zero here, and reads `rows[0]` for the figure in the hole.
 */
export const NoClients: Story = {
  args: { shares: [] },
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeInTheDocument()
    // No leader, so no percentage in the hole — and nothing reading «NaN٪».
    await expect(canvas.queryByText(/٪|%/)).toBeNull()
  },
}
