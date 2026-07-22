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
 * Controlled like the form controls it, but the spy from `args` is called too —
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

/**
 * Type with either keyboard — «۲۵۰۰» and "2500" both work. This is a text input
 * with its own parsing, not `<input type="number">`, which rejects Persian digits
 * outright and would leave the field looking broken to a Persian typist.
 */
export const Toman: Story = {
  args: { label: 'Amount received', value: 2500000, onValueChange: fn() },
  render: Controlled,
}

/** Two decimals for USD and USDT — toman has no sub-unit. */
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

/**
 * The whole reason this is not `<input type="number">`. An Iranian keyboard
 * types «۱۲۵۰۰۰۰۰»; what reaches the database has to be 12500000, and what the
 * user sees has to stay Persian while they type it.
 */
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

/**
 * The editing round trip, which is where a saved receipt gets silently zeroed.
 * The field renders `Intl`'s output, the user appends a digit to it, and the
 * whole string is parsed again — so the parser has to be able to read the
 * formatter's own separators.
 */
export const EditingItsOwnFormattingKeepsTheNumber: Story = {
  args: { label: 'Amount received', value: 12500000, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const input = await box(canvasElement)
    await expect(input).toHaveValue('۱۲٬۵۰۰٬۰۰۰')

    await userEvent.click(input)
    await userEvent.keyboard('{End}0')

    // A tenfold error, not a rounding one — this is the failure mode.
    await expect(args.onValueChange).toHaveBeenLastCalledWith(125000000)
    await expect(input).toHaveValue('۱۲۵٬۰۰۰٬۰۰۰')
  },
}

/**
 * Clearing the field means "no amount", not "zero". The form's validation
 * distinguishes them, and a receipt of 0 toman would save where an empty one
 * must not.
 */
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

/**
 * Decimals have to survive being typed. Reformatting «۱۲٫» back to «۱۲» on the
 * keystroke after the point makes the fractional part impossible to enter at
 * all, and the trailing zero of «۱۲٫۵۰» impossible to keep.
 */
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

/**
 * A zero is a figure, not an empty field. Only `null` may render blank —
 * otherwise a stored 0 looks like a value the user forgot to enter.
 */
export const ZeroIsShown: Story = {
  args: { label: 'Amount received', value: 0, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await expect(await box(canvasElement)).toHaveValue('۰')
  },
}

/** Ungrouped, for a field where separators would read as part of the value. */
export const Ungrouped: Story = {
  args: { label: 'Amount received', value: 1200.5, decimals: 2, grouped: false, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await expect(await box(canvasElement)).toHaveValue('1200.50')
  },
}

/**
 * English mode. Persian numerals are a property of the Persian locale — showing
 * «۱۲٬۵۰۰٬۰۰۰» to an English reader is the bug this hook exists to prevent, and
 * a Persian keyboard still has to be accepted while the interface is English.
 */
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
