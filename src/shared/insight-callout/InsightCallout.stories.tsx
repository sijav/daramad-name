import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from './InsightCallout'

const meta = { title: 'Shared/InsightCallout', component: InsightCallout } satisfies Meta<typeof InsightCallout>
export default meta
type Story = StoryObj<typeof meta>

const Concentration = () => {
  const { t } = useLingui()
  const { number } = useFormat()
  return <InsightCallout message={t`${number(73.2, 1)}% of your income comes from a single client.`} />
}

const base = { message: '' }

/** Fires above 50% client concentration — a risk worth naming, not an error. */
export const ClientConcentration: Story = { args: base, render: () => <Concentration /> }

export const Info: Story = { args: { message: '', tone: 'info' }, render: () => <InsightCallout tone="info" message="—" /> }
