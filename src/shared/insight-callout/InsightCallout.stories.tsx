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
    },
    tone: {
      control: 'inline-radio',
      options: ['warning', 'info'],
    },
  },
  args: { message: '', tone: 'warning' },
} satisfies Meta<typeof InsightCallout>

export default meta
type Story = StoryObj<typeof meta>

export const ClientConcentration: Story = {
  render: (args) => {
    const { t } = useLingui()
    const { digits } = useFormat()
    return <InsightCallout {...args} message={args.message || t`${digits(73)}% of your income comes from a single client.`} />
  },
}

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
