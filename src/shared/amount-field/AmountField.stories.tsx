import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SurfaceCard } from 'src/shared/surface-card'
import { CURRENCIES } from 'src/shared/types'
import { expect, fn, within } from 'storybook/test'
import { AmountField } from './AmountField'

const meta = {
  title: 'Shared/AmountField',
  component: AmountField,
  argTypes: {
    onValueChange: { description: 'Fires on every keystroke, with `null` while the field is empty.' },
    value: { description: 'The amount, or `null` for an empty field — which is not the same as zero.' },
    currency: { control: 'select', options: [...CURRENCIES] },
    error: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    // The label and the helper text are caller-supplied, and every caller
    // passes a catalog message. The harness does the same, so switching the
    // Language toolbar cannot leave an English label on a Persian card.
    label: { description: 'The caption above the field.', control: false },
    helperText: { description: 'What is wrong, or what the field expects.', control: false },
  },
} satisfies Meta<typeof AmountField>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controlled the way the receipt form controls it, and the spy from `args` is
 * called beside the local setter — what the box DISPLAYS and what it reports
 * upward are two different things, and only the second one reaches the
 * database.
 */
const Controlled: Story['render'] = function Render(args) {
  const { t } = useLingui()
  const [value, setValue] = useState<number | null>(args.value)

  return (
    <SurfaceCard sx={{ maxWidth: 520 }}>
      <AmountField
        {...args}
        label={t`Amount received`}
        // The helper text only ever appears with the error state, so the
        // `error` control drives both rather than leaving the reason behind
        // when the outline turns red.
        helperText={args.error ? t`Enter an amount greater than zero.` : undefined}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          args.onValueChange(next)
        }}
      />
    </SurfaceCard>
  )
}

const base = { label: 'Amount received', value: null, currency: 'TOMAN' as const, onValueChange: fn() }

const amountBox = async (canvasElement: HTMLElement) => within(canvasElement).findByRole<HTMLInputElement>('textbox')

/** Toman has no sub-unit, so no decimals are accepted. */
export const Toman: Story = {
  args: { ...base, value: 2500000 },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۲٬۵۰۰٬۰۰۰')
    await expect(await canvas.findByText(/^تومان$|^Toman$/)).toBeInTheDocument()
  },
}

/**
 * Tether and USD carry two decimals. The field takes its decimal count from the
 * currency, so a Tether amount keeps its cents — dropping them here would
 * silently round every foreign receipt to a whole unit before the rate is even
 * applied.
 */
export const Tether: Story = {
  args: { ...base, value: 1500, currency: 'USDT' },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۱٬۵۰۰٫۰۰')
    await expect(await canvas.findByText(/^تتر$|^Tether$/)).toBeInTheDocument()
  },
}

/** The third currency, so every member of the union has a rendered unit label. */
export const Dollar: Story = {
  args: { ...base, value: 1200.5, currency: 'USD' },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۱٬۲۰۰٫۵۰')
    await expect(await canvas.findByText(/^دلار$|^USD$/)).toBeInTheDocument()
  },
}

/** Empty state — the placeholder box keeps its full height so the form does not jump. */
export const Empty: Story = { args: base, render: Controlled }

/**
 * The reason, not just a red outline — a colour alone says nothing about what
 * to do next.
 */
export const Invalidated: Story = {
  args: { ...base, error: true },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/مبلغ را وارد کن|Enter an amount greater than zero/)).toBeInTheDocument()
    await expect(await amountBox(canvasElement)).toHaveAttribute('aria-invalid', 'true')
  },
}
