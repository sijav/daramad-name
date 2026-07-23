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
    value: { control: { type: 'number', step: 1000 } },
    currency: {
      control: 'inline-radio',
      options: ['TOMAN', 'USD', 'USDT'],
    },
    showUnit: { control: 'boolean' },
    variant: { control: 'select' },
  },
  args: { value: 12_500_000, currency: 'TOMAN', showUnit: true },
} satisfies Meta<typeof MoneyText>

export default meta
type Story = StoryObj<typeof meta>

const money = (canvasElement: HTMLElement, text: string | RegExp) => within(canvasElement).findByText(text)

export const Toman: Story = {
  args: { value: 12500000 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰ تومان')).toBeInTheDocument()
  },
}

export const TomanRounded: Story = {
  args: { value: 9500000.4, variant: 'h3' },
  play: async ({ canvasElement }) => {
    // Not «۹٬۵۰۰٬۰۰۰٫۴۰»: toman has no sub-unit, and a stray decimal on a
    // headline figure reads as a different number entirely.
    await expect(await money(canvasElement, '۹٬۵۰۰٬۰۰۰ تومان')).toBeInTheDocument()
  },
}

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

export const Zero: Story = {
  args: { value: 0 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۰ تومان')).toBeInTheDocument()
  },
}

export const WithoutUnit: Story = {
  args: { value: 12500000, showUnit: false },
  play: async ({ canvasElement }) => {
    const element = await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰')
    await expect(element).not.toHaveTextContent('تومان')
  },
}

export const DirectionIsExplicit: Story = {
  args: { value: 12500000 },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '۱۲٬۵۰۰٬۰۰۰ تومان')).toHaveAttribute('dir', 'rtl')
  },
}

export const English: Story = {
  args: { value: 12500000 },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const element = await money(canvasElement, '12,500,000 Toman')
    await expect(element).toHaveAttribute('dir', 'ltr')
    await expect(element).not.toHaveTextContent(/[۰-۹]/)
  },
}

export const EnglishDollars: Story = {
  args: { value: 1200.5, currency: 'USD' },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    await expect(await money(canvasElement, '1,200.50 USD')).toBeInTheDocument()
  },
}
