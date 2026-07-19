import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DateField } from './DateField'

const meta = {
  title: 'Shared/DateField',
  component: DateField,
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState(args.value)
  return (
    <div style={{ width: 320 }}>
      <DateField {...args} value={value} onValueChange={setValue} />
    </div>
  )
}

/**
 * Jalali picker. The digits look Persian but the DOM value stays ASCII — MUI X
 * measures each field section against ASCII '0', so the Persian numerals come
 * from Vazirmatn's Farsi-Digits cut rather than from the adapter.
 */
export const Jalali: Story = {
  args: { label: 'Date received', value: new Date().toISOString(), onValueChange: () => {} },
  render: Controlled,
}

/** Filters allow future dates; the receipt form does not. */
export const AllowsFuture: Story = {
  args: { label: 'To date', value: new Date().toISOString(), disableFuture: false, onValueChange: () => {} },
  render: Controlled,
}
