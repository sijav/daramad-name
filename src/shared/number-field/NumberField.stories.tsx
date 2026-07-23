import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { NumberField } from './NumberField'

const meta = {
  title: 'Shared/NumberField',
  component: NumberField,
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controlled like the form controls it, but the spy from `args` is called too
 * what the field DISPLAYS and what it reports upward are two different things,
 * and only the second one reaches the database.
 */
const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState<number | null>(args.value)
  return (
    <NumberField
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        args.onValueChange(next)
      }}
      sx={{ width: 320 }}
    />
  )
}

const box = async (canvasElement: HTMLElement) => within(canvasElement).findByRole<HTMLInputElement>('textbox')

export const Toman: Story = {
  args: { label: 'Amount received', value: 2500000, onValueChange: fn() },
  render: Controlled,
}

export const WithDecimals: Story = {
  args: { label: 'Amount received', value: 1200.5, decimals: 2, onValueChange: fn() },
  render: Controlled,
}

export const Empty: Story = {
  args: { label: "Today's exchange rate (Toman)", value: null, onValueChange: fn() },
  render: Controlled,
}

export const WithError: Story = {
  args: {
    label: 'Amount received',
    value: null,
    error: true,
    helperText: 'Enter an amount greater than zero.',
    onValueChange: fn(),
  },
  render: Controlled,
}

export const AcceptsAPersianKeyboard: Story = {
  args: { label: 'Amount received', value: null, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)

    await userEvent.type(input, '۱۲۵۰۰۰۰۰')

    await expect(args.onValueChange).toHaveBeenLastCalledWith(12500000)
    // Grouped as a Persian reader writes it: U+066C, not a Latin comma.
    await expect(input).toHaveValue('۱۲٬۵۰۰٬۰۰۰')
  },
}

export const EditingItsOwnFormattingKeepsTheNumber: Story = {
  args: { label: 'Amount received', value: 12500000, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)
    await expect(input).toHaveValue('۱۲٬۵۰۰٬۰۰۰')

    await userEvent.click(input)
    await userEvent.keyboard('{End}0')

    // A tenfold error, not a rounding one, this is the failure mode.
    await expect(args.onValueChange).toHaveBeenLastCalledWith(125000000)
    await expect(input).toHaveValue('۱۲۵٬۰۰۰٬۰۰۰')
  },
}

export const ClearingReportsNullRatherThanZero: Story = {
  args: { label: 'Amount received', value: 2500000, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)

    await userEvent.clear(input)

    await expect(args.onValueChange).toHaveBeenLastCalledWith(null)
    await expect(input).toHaveValue('')
  },
}

export const KeepsTheDecimalsBeingTyped: Story = {
  args: { label: 'Amount received', value: null, decimals: 2, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)

    await userEvent.type(input, '1200.50')

    await expect(args.onValueChange).toHaveBeenLastCalledWith(1200.5)
    // «٫» is the Persian decimal separator, U+066B.
    await expect(input).toHaveValue('۱٬۲۰۰٫۵۰')
  },
}

export const ZeroIsShown: Story = {
  args: { label: 'Amount received', value: 0, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await expect(await box(canvasElement)).toHaveValue('۰')
  },
}

export const Ungrouped: Story = {
  args: { label: 'Amount received', value: 1200.5, decimals: 2, grouped: false, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await expect(await box(canvasElement)).toHaveValue('1200.50')
  },
}

export const EnglishLocale: Story = {
  args: { label: 'Amount received', value: 12500000, onValueChange: fn() },
  render: Controlled,
  globals: { locale: 'en-US' },
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)
    await expect(input).toHaveValue('12,500,000')

    await userEvent.clear(input)
    await userEvent.type(input, '۲۵۰۰')

    await expect(args.onValueChange).toHaveBeenLastCalledWith(2500)
    await expect(input).toHaveValue('2,500')
  },
}
