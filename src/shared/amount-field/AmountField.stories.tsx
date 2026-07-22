import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SurfaceCard } from 'src/shared/surface-card'
import type { Currency } from 'src/shared/types'
import { expect, fn, within } from 'storybook/test'
import { AmountField } from './AmountField'

const meta = { title: 'Shared/AmountField', component: AmountField } satisfies Meta<typeof AmountField>
export default meta
type Story = StoryObj<typeof meta>

/**
 * The design's `Amount Field`: a 72px box with the currency on the leading edge
 * and the amount set at 28px bold on the trailing edge.
 *
 * Deliberately the biggest control on the record card — the amount is the one
 * value the user always types, and the 15-second path depends on hitting it
 * without aiming.
 */
const Harness = ({ currency, initial }: { currency: Currency; initial: number | null }) => {
  const { t } = useLingui()
  const [value, setValue] = useState<number | null>(initial)
  return (
    <SurfaceCard sx={{ maxWidth: 520 }}>
      <AmountField label={t`Amount received`} value={value} currency={currency} onValueChange={setValue} />
    </SurfaceCard>
  )
}

const Invalid = () => {
  const { t } = useLingui()
  return (
    <SurfaceCard sx={{ maxWidth: 520 }}>
      <AmountField
        label={t`Amount received`}
        value={null}
        currency="TOMAN"
        onValueChange={() => {}}
        error
        helperText={t`Enter an amount greater than zero.`}
      />
    </SurfaceCard>
  )
}

const base = { label: '', value: null, currency: 'TOMAN' as Currency, onValueChange: fn() }

const amountBox = async (canvasElement: HTMLElement) => within(canvasElement).findByRole<HTMLInputElement>('textbox')

/** Toman has no sub-unit, so no decimals are accepted. */
export const Toman: Story = {
  args: base,
  render: () => <Harness currency="TOMAN" initial={2500000} />,
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
  args: base,
  render: () => <Harness currency="USDT" initial={1500} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await amountBox(canvasElement)).toHaveValue('۱٬۵۰۰٫۰۰')
    await expect(await canvas.findByText(/^تتر$|^Tether$/)).toBeInTheDocument()
  },
}

/** Empty state — the placeholder box keeps its full height so the form does not jump. */
export const Empty: Story = { args: base, render: () => <Harness currency="TOMAN" initial={null} /> }

export const Invalidated: Story = {
  args: base,
  render: () => <Invalid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The reason, not just a red outline — a colour alone says nothing about
    // what to do next.
    await expect(await canvas.findByText(/مبلغ را وارد کن|Enter an amount greater than zero/)).toBeInTheDocument()
  },
}
