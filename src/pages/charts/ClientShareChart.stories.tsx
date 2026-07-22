import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartCard } from 'src/shared/chart-card'
import { InsightCallout } from 'src/shared/insight-callout'
import type { ClientShare } from 'src/shared/types'
import { ClientShareChart } from './ClientShareChart'

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

const meta = { title: 'Pages/Charts/ClientShareChart', component: ClientShareChart, parameters: { ...CHART_A11Y } } satisfies Meta<
  typeof ClientShareChart
>
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

const View = ({ shares, insight }: { shares: ClientShare[]; insight?: string }) => {
  const { t } = useLingui()
  return (
    <div style={{ maxWidth: 544 }}>
      <ChartCard title={t`Client share of income`} subtitle={t`Based on the income recorded this year`}>
        <ClientShareChart shares={shares} othersLabel={t`Others`} />
      </ChartCard>
      {insight ? <div style={{ marginTop: 16 }}>{<InsightCallout message={insight} />}</div> : null}
    </div>
  )
}

const base = { shares: [], othersLabel: '' }

/** Balanced book — no single client dominates, so no warning appears. */
export const Balanced: Story = { args: base, render: () => <View shares={BALANCED} /> }

/** Above 50% the dependency warning fires; shown with the callout it explains. */
export const Concentrated: Story = {
  args: base,
  render: () => <View shares={CONCENTRATED} insight="۷۳٪ درآمدت از یک مشتری است." />,
}

/** A single client — the extreme concentration case. */
export const SingleClient: Story = { args: base, render: () => <View shares={[share('Aria Trading', 235830000, 100)]} /> }

/** More clients than legend rows: the tail folds into one "others" slice. */
export const ManyClients: Story = {
  args: base,
  render: () => <View shares={[...CONCENTRATED, share('Mr. Chen', 8000000, 2), share('Studio B', 4000000, 1)]} />,
}
