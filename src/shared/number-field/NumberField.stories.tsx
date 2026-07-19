import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { NumberField } from './NumberField'

const meta = {
  title: 'Shared/NumberField',
  component: NumberField,
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState<number | null>(args.value)
  return <NumberField {...args} value={value} onValueChange={setValue} sx={{ width: 320 }} />
}

/**
 * Type with either keyboard — «۲۵۰۰» and "2500" both work. This is a text input
 * with its own parsing, not `<input type="number">`, which rejects Persian digits
 * outright and would leave the field looking broken to a Persian typist.
 */
export const Toman: Story = {
  args: { label: 'مبلغ دریافتی', value: 2500000, onValueChange: () => {} },
  render: Controlled,
}

/** Two decimals for USD and USDT — toman has no sub-unit. */
export const WithDecimals: Story = {
  args: { label: 'مبلغ دریافتی', value: 1200.5, decimals: 2, onValueChange: () => {} },
  render: Controlled,
}

export const Empty: Story = {
  args: { label: 'نرخ تبدیل روز (تومان)', value: null, onValueChange: () => {} },
  render: Controlled,
}

export const WithError: Story = {
  args: {
    label: 'مبلغ دریافتی',
    value: null,
    error: true,
    helperText: 'مبلغ را وارد کن؛ باید بزرگ‌تر از صفر باشه.',
    onValueChange: () => {},
  },
  render: Controlled,
}
