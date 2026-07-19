import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoneyText } from './MoneyText'

const meta = {
  title: 'Shared/MoneyText',
  component: MoneyText,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MoneyText>

export default meta
type Story = StoryObj<typeof meta>

export const Toman: Story = { args: { value: 12500000 } }

/** Toman never shows decimals, even for an amount that has them. */
export const TomanRounded: Story = { args: { value: 9500000, variant: 'h3' } }

/** USD and USDT carry two decimals — the brief's edge case. */
export const Dollars: Story = { args: { value: 1200.5, currency: 'USD' } }

export const Tether: Story = { args: { value: 500, currency: 'USDT' } }

/** A zero month must render as «۰», not as an empty cell. */
export const Zero: Story = { args: { value: 0 } }
