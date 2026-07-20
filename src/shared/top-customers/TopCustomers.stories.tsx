import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import type { ClientShare } from 'src/shared/types'
import { TopCustomers } from './TopCustomers'

const meta = { title: 'Shared/TopCustomers', component: TopCustomers } satisfies Meta<typeof TopCustomers>
export default meta
type Story = StoryObj<typeof meta>

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

const View = ({ shares, limit }: { shares: ClientShare[]; limit?: number }) => {
  const { t } = useLingui()
  return (
    <SurfaceCard sx={{ maxWidth: 440 }}>
      <TopCustomers shares={shares} limit={limit} othersLabel={t`Others`} />
    </SurfaceCard>
  )
}

const base = { shares: [], othersLabel: '' }

/** Complements the donut: legible at any share, with exact figures beside each name. */
export const Ranked: Story = { args: base, render: () => <View shares={RANKED} /> }

/** Anything past the limit folds into an "others" row rather than being dropped. */
export const WithOthers: Story = {
  args: base,
  render: () => <View shares={[...RANKED, share('Dadepardaz Co.', 13100000, 3)]} limit={3} />,
}

/** A long client name must truncate rather than push the figure off the row. */
export const LongName: Story = {
  args: base,
  render: () => <View shares={[share('Dadepardaz Pars Software Engineering & Partners', 235830000, 100)]} />,
}
