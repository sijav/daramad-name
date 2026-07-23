import { useLingui } from '@lingui/react/macro'
import { Box } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { InsightCallout } from './InsightCallout'

// The sentence is composed inside each render so the copy follows the Language
// toolbar the way the app's does — but a message typed into Controls wins over
// the sample, which is what makes the panel worth opening.
const meta = {
  title: 'Shared/InsightCallout',
  component: InsightCallout,
  argTypes: {
    message: {
      control: 'text',
      description: 'The sentence. Blank falls back to the story’s translated sample; the component never wraps it in a heading.',
    },
    tone: {
      control: 'inline-radio',
      options: ['warning', 'info'],
      description: '`warning` names a risk worth acting on; `info` explains how something works. Neither is an error.',
    },
  },
  args: { message: '', tone: 'warning' },
} satisfies Meta<typeof InsightCallout>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Fires above 50% client concentration — a risk worth naming, not an error.
 *
 * A whole percent, because the legend beside it prints one: a callout reading
 * «۷۳٫۲٪» next to a slice labelled «۷۳٪» is the mismatch `getClientShares`
 * rounds to avoid.
 */
export const ClientConcentration: Story = {
  render: (args) => {
    const { t } = useLingui()
    const { digits } = useFormat()
    return <InsightCallout {...args} message={args.message || t`${digits(73)}% of your income comes from a single client.`} />
  },
}

/**
 * The informational tone, in a column narrow enough to wrap the sentence.
 *
 * That wrap is the layout the component is built around: the row is
 * `flex-start` aligned and the dot carries a 6px block start so it sits on the
 * first line of text rather than centring itself against the whole paragraph.
 */
export const Info: Story = {
  args: { tone: 'info' },
  render: (args) => {
    const { t } = useLingui()
    return (
      <Box sx={{ maxWidth: 360 }}>
        <InsightCallout
          {...args}
          message={
            args.message ||
            t`The rate and Toman equivalent are stored at the moment you record a receipt. Later rate changes do not affect it.`
          }
        />
      </Box>
    )
  },
}
