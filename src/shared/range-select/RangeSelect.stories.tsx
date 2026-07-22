import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, within } from 'storybook/test'
import { RangeSelect } from './RangeSelect'

const meta = {
  title: 'Shared/RangeSelect',
  component: RangeSelect,
} satisfies Meta<typeof RangeSelect>

export default meta
type Story = StoryObj<typeof meta>

/** The pill in every page header — chevron on the leading edge, label inline. */
export const Default: Story = {
  args: {
    value: 1403,
    prefix: 'بازه گزارش',
    options: [
      { value: 1403, label: '۱۴۰۳' },
      { value: 1402, label: '۱۴۰۲' },
    ],
    onSelect: fn(),
  },
  render: function Render(args) {
    const [year, setYear] = useState('1403')
    return <RangeSelect {...args} value={year} onSelect={setYear} />
  },
}

/**
 * The pill has no label above it, and `role="combobox"` does NOT take its name
 * from the text inside it — so the control announced nothing at all, which axe
 * reports as `aria-input-field-name` (serious). `prefix` is already the label
 * the design prints in the pill, so it names the control too and the visible
 * text cannot drift away from the spoken one.
 */
export const IsNamedForScreenReaders: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('combobox', { name: 'بازه گزارش' })).toBeInTheDocument()
  },
}
