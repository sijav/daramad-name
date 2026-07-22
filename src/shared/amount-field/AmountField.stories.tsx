import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SurfaceCard } from 'src/shared/surface-card'
import type { Currency } from 'src/shared/types'
import { fn } from 'storybook/test'
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

/** Toman has no sub-unit, so no decimals are accepted. */
export const Toman: Story = { args: base, render: () => <Harness currency="TOMAN" initial={2500000} /> }

/** Tether and USD carry two decimals. */
export const Tether: Story = { args: base, render: () => <Harness currency="USDT" initial={1500} /> }

/** Empty state — the placeholder box keeps its full height so the form does not jump. */
export const Empty: Story = { args: base, render: () => <Harness currency="TOMAN" initial={null} /> }

export const Invalidated: Story = { args: base, render: () => <Invalid /> }
