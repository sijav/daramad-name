import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import { InsightBanner } from 'src/shared/insight-banner'
import type { ClientShare } from 'src/shared/types'
import { ClientShareChart } from './ClientShareChart'

const meta = {
  title: 'Pages/Charts/ClientShareChart',
  component: ClientShareChart,
} satisfies Meta<typeof ClientShareChart>

export default meta
type Story = StoryObj<typeof meta>

const share = (clientName: string, totalToman: number, percentage: number): ClientShare => ({
  clientId: clientName,
  clientName,
  totalToman,
  percentage,
})

/** Balanced book — no single client dominates, so no warning appears. */
export const Balanced: Story = {
  args: {
    shares: [
      share('Aria Trading', 120000000, 34.3),
      share('Naghsh Studio', 100000000, 28.6),
      share('Dadepardaz Co.', 80000000, 22.9),
      share('Homa Cafe', 50000000, 14.2),
    ],
  },
  render: (args) => (
    <GlassCard>
      <ClientShareChart {...args} />
    </GlassCard>
  ),
}

/**
 * Above 50% the dependency warning fires. Shown together here because the
 * insight is meaningless without the chart it explains.
 */
export const Concentrated: Story = {
  args: {
    shares: [
      share('Aria Trading', 235830000, 73.2),
      share('Naghsh Studio', 54840000, 17.0),
      share('Dadepardaz Co.', 22000000, 6.8),
      share('Homa Cafe', 9500000, 3.0),
    ],
  },
  render: (args) => (
    <GlassCard>
      <ClientShareChart {...args} />
      <InsightBanner
        sx={{ mt: 2 }}
        message="73.2% of your income comes from one client (“Aria Trading”). If they leave, a large part of your income goes with them."
      />
    </GlassCard>
  ),
}

/** A single client — the extreme concentration case. */
export const SingleClient: Story = {
  ...Balanced,
  args: { shares: [share('Aria Trading', 235830000, 100)] },
}
