import { useLingui } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { InsightCallout, type InsightTone } from './InsightCallout'

// The sentence is composed inside each render rather than passed as an arg, so
// the copy follows the Language toolbar the way the app's does. `message` is
// hidden from the Controls panel for that reason; `tone` is the live control.
const meta = {
  title: 'Shared/InsightCallout',
  component: InsightCallout,
  argTypes: { tone: { control: 'inline-radio', options: ['warning', 'info'] } },
  parameters: { controls: { exclude: ['message'] } },
  args: { message: '', tone: 'warning' },
} satisfies Meta<typeof InsightCallout>

export default meta
type Story = StoryObj<typeof meta>

/** The dashboard's and the charts page's sentence, to the digit. */
const Concentration = ({ tone }: { tone?: InsightTone }) => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return <InsightCallout tone={tone} message={t`${digits(73)}% of your income comes from a single client.`} />
}

/** Quick entry's note beside the rate field — two sentences, and it wraps. */
const StoredRate = ({ tone }: { tone?: InsightTone }) => {
  const { t } = useLingui()
  return (
    <InsightCallout
      tone={tone}
      message={t`The rate and Toman equivalent are stored at the moment you record a receipt. Later rate changes do not affect it.`}
    />
  )
}

/**
 * Fires above 50% client concentration — a risk worth naming, not an error.
 *
 * A whole percent, because the legend beside it prints one: a callout reading
 * «۷۳٫۲٪» next to a slice labelled «۷۳٪» is the mismatch `getClientShares`
 * rounds to avoid.
 */
export const ClientConcentration: Story = { render: (args) => <Concentration tone={args.tone} /> }

/**
 * The informational tone, in a column narrow enough to wrap the sentence.
 *
 * That wrap is the layout the component is built around: the row is
 * `flex-start` aligned and the dot carries a 6px block start so it sits on the
 * first line of text rather than centring itself against the whole paragraph.
 */
export const Info: Story = {
  args: { tone: 'info' },
  render: (args) => (
    <Box sx={{ maxWidth: 360 }}>
      <StoredRate tone={args.tone} />
    </Box>
  ),
}
