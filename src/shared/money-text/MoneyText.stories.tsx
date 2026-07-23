import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MoneyText } from './MoneyText'

const meta = {
  title: 'Shared/MoneyText',
  component: MoneyText,
  parameters: {
    layout: 'centered',
  },
  // `MoneyText` forwards the rest of `TypographyProps`, so docgen offers all of
  // MUI's typography surface. These four are the ones that change what the
  // figure SAYS. Only the control shape is set — the descriptions come from the
  // JSDoc on `MoneyTextProps`, so the table cannot drift from the source.
  argTypes: {
    value: { description: 'The amount, in whichever currency is passed below.', control: { type: 'number', step: 1000 } },
    currency: {
      description: 'Omit for toman; pass a currency to render the original amount instead.',
      control: 'inline-radio',
      options: ['TOMAN', 'USD', 'USDT'],
    },
    showUnit: { description: 'Appends the currency name.', control: 'boolean' },
    variant: { control: 'select' },
  },
  args: { value: 12_500_000, currency: 'TOMAN', showUnit: true },
} satisfies Meta<typeof MoneyText>

export default meta
type Story = StoryObj<typeof meta>

const money = (canvasElement: HTMLElement, text: string | RegExp) => within(canvasElement).findByText(text)

/**
 * The default: toman, grouped, with its unit. Every figure in the app comes
 * through here, so the grouping and the unit can never differ between the
 * ledger, the charts and the certificate.
 */
export const Toman: Story = {
  args: { value: 12500000 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰ تومان')).toBeInTheDocument()
  },
}

/** Toman never shows decimals, even for an amount that has them. */
export const TomanRounded: Story = {
  args: { value: 9500000.4, variant: 'h3' },
  play: async ({ canvasElement }) => {
    // Not «۹٬۵۰۰٬۰۰۰٫۴۰»: toman has no sub-unit, and a stray decimal on a
    // headline figure reads as a different number entirely.
    await expect(await money(canvasElement, '۹٬۵۰۰٬۰۰۰ تومان')).toBeInTheDocument()
  },
}

/** USD and USDT carry two decimals — the brief's edge case. */
export const Dollars: Story = {
  args: { value: 1200.5, currency: 'USD' },
  play: async ({ canvasElement }) => {
    // The trailing zero has to be there: «۱٬۲۰۰٫۵» is not how an amount is written.
    await expect(await money(canvasElement, '۱٬۲۰۰٫۵۰ دلار')).toBeInTheDocument()
  },
}

export const Tether: Story = {
  args: { value: 500, currency: 'USDT' },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۵۰۰٫۰۰ تتر')).toBeInTheDocument()
  },
}

/** A zero month must render as «۰», not as an empty cell. */
export const Zero: Story = {
  args: { value: 0 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۰ تومان')).toBeInTheDocument()
  },
}

/**
 * Without the unit, for a column whose header already says «تومان». The figure
 * still has to be the same figure — the unit is the only thing that goes.
 */
export const WithoutUnit: Story = {
  args: { value: 12500000, showUnit: false },
  play: async ({ canvasElement }) => {
    const element = await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰')
    await expect(element).not.toHaveTextContent('تومان')
  },
}

/**
 * Money is a bidirectional hazard: the digits run left to right inside a line
 * that runs right to left, so an unmarked amount can render with its unit on
 * the wrong end. The span states its own direction rather than inheriting it.
 */
export const DirectionIsExplicit: Story = {
  args: { value: 12500000 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰ تومان')).toHaveAttribute('dir', 'rtl')
  },
}

/**
 * English mode: Latin digits, commas, and the unit spelled out in English —
 * and the direction flips with it.
 */
export const English: Story = {
  args: { value: 12500000 },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const element = await money(canvasElement, '12,500,000 Toman')
    await expect(element).toHaveAttribute('dir', 'ltr')
    await expect(element).not.toHaveTextContent(/[۰-۹]/)
  },
}

/** English dollars: two decimals survive the locale switch. */
export const EnglishDollars: Story = {
  args: { value: 1200.5, currency: 'USD' },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '1,200.50 USD')).toBeInTheDocument()
  },
}
