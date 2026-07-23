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
    currency: { control: 'select', options: [...CURRENCIES] },
    error: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    // The label and the helper text are caller-supplied, and every caller
    // passes a catalog message. The harness does the same, so switching the
    // Language toolbar cannot leave an English label on a Persian card.
    label: { control: false },
    helperText: { control: false },
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

export const Toman: Story = {
  args: { ...base, value: 2500000 },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۲٬۵۰۰٬۰۰۰')
    await expect(await canvas.findByText(/^تومان$|^Toman$/)).toBeInTheDocument()
  },
}

export const Tether: Story = {
  args: { ...base, value: 1500, currency: 'USDT' },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۱٬۵۰۰٫۰۰')
    await expect(await canvas.findByText(/^تتر$|^Tether$/)).toBeInTheDocument()
  },
}

export const Dollar: Story = {
  args: { ...base, value: 1200.5, currency: 'USD' },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۱٬۲۰۰٫۵۰')
    await expect(await canvas.findByText(/^دلار$|^USD$/)).toBeInTheDocument()
  },
}

export const Empty: Story = { args: base, render: Controlled }

export const Invalidated: Story = {
  args: { ...base, error: true },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/مبلغ را وارد کن|Enter an amount greater than zero/)).toBeInTheDocument()
    await expect(await amountBox(canvasElement)).toHaveAttribute('aria-invalid', 'true')
  },
}
