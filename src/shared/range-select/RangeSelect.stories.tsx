import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
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
