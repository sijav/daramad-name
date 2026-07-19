import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import type { ClientShare } from 'src/shared/types'
import { TopCustomers } from './TopCustomers'

const meta = {
  title: 'Shared/TopCustomers',
  component: TopCustomers,
  render: (args) => (
    <GlassCard sx={{ maxWidth: 440 }}>
      <TopCustomers {...args} />
    </GlassCard>
  ),
} satisfies Meta<typeof TopCustomers>

export default meta
type Story = StoryObj<typeof meta>

const share = (clientName: string, totalToman: number, percentage: number): ClientShare => ({
  clientId: clientName,
  clientName,
  totalToman,
  percentage,
})

/** Complements the donut: legible at any share, and exact figures beside each name. */
export const Ranked: Story = {
  args: {
    othersLabel: 'بقیه',
    shares: [
      share('بازرگانی آریا', 235830000, 54),
      share('استودیو نقش', 91700000, 21),
      share('Mr. Chen', 69860000, 16),
      share('کافه رستوران هما', 39300000, 9),
    ],
  },
}

/** Anything past the limit folds into an "others" row rather than being dropped. */
export const WithOthers: Story = {
  args: {
    othersLabel: 'بقیه',
    limit: 3,
    shares: [
      share('بازرگانی آریا', 235830000, 54),
      share('استودیو نقش', 91700000, 21),
      share('Mr. Chen', 69860000, 16),
      share('کافه رستوران هما', 26200000, 6),
      share('شرکت داده‌پرداز', 13100000, 3),
    ],
  },
}

/** A long client name must truncate rather than push the figure off the row. */
export const LongName: Story = {
  args: {
    othersLabel: 'بقیه',
    shares: [share('شرکت مهندسی نرم‌افزار داده‌پرداز پارس و همکاران', 235830000, 100)],
  },
}
