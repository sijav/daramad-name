import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ClientShare } from 'src/shared/types'
import { TopCustomers } from './TopCustomers'

const share = (clientName: string, totalToman: number, percentage: number): ClientShare => ({
  clientId: clientName,
  clientName,
  totalToman,
  percentage,
})

const RANKED = [
  share('Aria Trading', 235830000, 54),
  share('Naghsh Studio', 91700000, 21),
  share('Mr. Chen', 69860000, 16),
  share('Homa Cafe', 39300000, 9),
]

const meta = {
  title: 'Shared/TopCustomers',
  component: TopCustomers,
  argTypes: {
    shares: { control: 'object' },
    limit: {
      control: { type: 'number', min: 1, max: 10 },
    },
    othersLabel: {
      control: 'text',
    },
  },
  args: { shares: RANKED, othersLabel: '' },
  render: (args) => {
    const { t } = useLingui()
    return (
      <SurfaceCard sx={{ maxWidth: 440 }}>
        <TopCustomers {...args} othersLabel={args.othersLabel || t`Others`} />
      </SurfaceCard>
    )
  },
} satisfies Meta<typeof TopCustomers>
export default meta
type Story = StoryObj<typeof meta>

export const Ranked: Story = {}

export const WithOthers: Story = {
  args: { shares: [...RANKED, share('Dadepardaz Co.', 13100000, 3)], limit: 3 },
}

export const LongName: Story = {
  args: { shares: [share('Dadepardaz Pars Software Engineering & Partners', 235830000, 100)] },
}
