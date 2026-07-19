import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'

const meta = {
  title: 'Shared/SegmentedControl',
  component: SegmentedControl,
} satisfies Meta<typeof SegmentedControl<string>>

export default meta
type Story = StoryObj<typeof meta>

/** The currency picker from the record card: a filled primary pill on a recessed track. */
export const Currency: Story = {
  args: {
    value: 'USDT',
    options: [
      { value: 'USDT', label: 'Tether' },
      { value: 'USD', label: 'USD' },
      { value: 'TOMAN', label: 'Toman' },
    ],
    onValueChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />
  },
}

/** Two segments — the report's language switch. */
export const TwoOptions: Story = {
  ...Currency,
  args: {
    value: 'fa',
    options: [
      { value: 'fa', label: 'Persian' },
      { value: 'en', label: 'English' },
    ],
    onValueChange: () => {},
  },
}
