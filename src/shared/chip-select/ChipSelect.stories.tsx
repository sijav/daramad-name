import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ChipSelect } from './ChipSelect'

const meta = {
  title: 'Shared/ChipSelect',
  component: ChipSelect,
} satisfies Meta<typeof ChipSelect<string>>

export default meta
type Story = StoryObj<typeof meta>

const CHANNELS = [
  { value: 'CARD_TO_CARD', label: 'Card to card' },
  { value: 'REMITTANCE', label: 'Wire transfer' },
  { value: 'TETHER', label: 'Tether' },
  { value: 'OTHER', label: 'Other' },
]

/** The receipt channel picker. The selected pill takes the primary container fill. */
export const Channels: Story = {
  args: { label: 'Payment channel', value: 'TETHER', options: CHANNELS, onValueChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <ChipSelect {...args} value={value} onValueChange={setValue} />
  },
}

/** Without a label, for use inside a field that already has one. */
export const Unlabelled: Story = {
  ...Channels,
  args: { value: 'CARD_TO_CARD', options: CHANNELS, onValueChange: () => {} },
}
