import { Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { useFormat } from './useFormat'

// 1 August 2026 is 10 Mordad 1405. Built from local components so the Jalali
// conversion does not depend on the machine's timezone.
const FROM = new Date(2026, 7, 1, 12).toISOString()
const TO = new Date(2026, 7, 15, 12).toISOString()

/**
 * Every number and date the app prints goes through `useFormat`. This exercises
 * all of it at once, because the failure it guards against is one surface
 * drifting from the others — not the hook being broken outright.
 */
const FormatSample = () => {
  const { persian, digits, number, amount, date, dateLong, dateRange } = useFormat()

  return (
    <Stack spacing={1}>
      <Typography data-testid="persian">{String(persian)}</Typography>
      <Typography data-testid="digits">{digits(1405)}</Typography>
      <Typography data-testid="number">{number(12500000)}</Typography>
      <Typography data-testid="amount">{amount(1200.5, 'USD')}</Typography>
      <Typography data-testid="date">{date(FROM)}</Typography>
      <Typography data-testid="dateLong">{dateLong(FROM)}</Typography>
      <Typography data-testid="dateRange">{dateRange(FROM, TO)}</Typography>
    </Stack>
  )
}

/**
 * Every number and date the app prints goes through `useFormat`. These stories
 * exercise all of it at once, because the failure worth catching is one surface
 * drifting from the others — not the hook being broken outright.
 */
const meta = {
  title: 'Shared/useFormat',
  component: FormatSample,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FormatSample>

export default meta
type Story = StoryObj<typeof meta>

/** Persian: Persian numerals, the Arabic separators, and the Jalali calendar. */
export const Persian: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('persian')).toHaveTextContent('true')
    await expect(await canvas.findByTestId('digits')).toHaveTextContent('۱۴۰۵')
    await expect(await canvas.findByTestId('number')).toHaveTextContent('۱۲٬۵۰۰٬۰۰۰')
    // USD carries two decimals; toman has none.
    await expect(await canvas.findByTestId('amount')).toHaveTextContent('۱٬۲۰۰٫۵۰')
    await expect(await canvas.findByTestId('date')).toHaveTextContent('۱۴۰۵/۰۵/۱۰')
    await expect(await canvas.findByTestId('dateLong')).toHaveTextContent('۱۰ مرداد ۱۴۰۵')
    // The shared month and year written once, per the range rule.
    await expect(await canvas.findByTestId('dateRange')).toHaveTextContent('۱۰ تا ۲۴ مرداد ۱۴۰۵')
  },
}

/**
 * English mode, and the reason this hook exists at all: Persian numerals are a
 * property of the Persian locale, not of the app. «۶۴۹,۹۸۰,۰۰۰» in front of an
 * English reader shipped as a live bug, because a component reached past the
 * hook and called `toPersianDigits` itself.
 *
 * The calendar stays Jalali here on purpose: the calendar system is a separate
 * setting from the language, so an English interface must still be able to
 * print «10 Mordad 1405» rather than switching to Gregorian behind the user.
 */
export const English: Story = {
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('persian')).toHaveTextContent('false')
    await expect(await canvas.findByTestId('digits')).toHaveTextContent('1405')
    await expect(await canvas.findByTestId('number')).toHaveTextContent('12,500,000')
    await expect(await canvas.findByTestId('amount')).toHaveTextContent('1,200.50')
    await expect(await canvas.findByTestId('date')).toHaveTextContent('1405/05/10')
    await expect(await canvas.findByTestId('dateLong')).toHaveTextContent('10 Mordad 1405')
    await expect(await canvas.findByTestId('dateRange')).toHaveTextContent('10 to 24 Mordad 1405')

    // And nothing anywhere on the sample carries a Persian numeral.
    await expect(canvasElement).not.toHaveTextContent(/[۰-۹]/)
  },
}
