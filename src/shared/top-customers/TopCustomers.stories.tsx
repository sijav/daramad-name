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

/**
 * The ranked client list beside the donut, in the card it always sits in.
 *
 * `shares` is a live object control: add a row, change a figure, or push the
 * list past `limit` and the fold appears. The label for the folded row comes
 * from the catalog so it follows the Language toolbar, and anything typed into
 * Controls overrides it.
 */
const meta = {
  title: 'Shared/TopCustomers',
  component: TopCustomers,
  argTypes: {
    shares: { control: 'object', description: 'Ranked clients. The component does not sort — it prints what the query ordered.' },
    limit: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Rows past this fold into one "others" row rather than being dropped.',
    },
    othersLabel: {
      control: 'text',
      description: 'The folded row’s name. Passed in rather than translated inside, so the caller owns the wording.',
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

/** Complements the donut: legible at any share, with exact figures beside each name. */
export const Ranked: Story = {}

/** Anything past the limit folds into an "others" row rather than being dropped. */
export const WithOthers: Story = {
  args: { shares: [...RANKED, share('Dadepardaz Co.', 13100000, 3)], limit: 3 },
}

/** A long client name must truncate rather than push the figure off the row. */
export const LongName: Story = {
  args: { shares: [share('Dadepardaz Pars Software Engineering & Partners', 235830000, 100)] },
}
