import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { DateField } from './DateField'

const meta = {
  title: 'Shared/DateField',
  component: DateField,
  argTypes: {
    value: {
      description:
        "ISO-8601 instant, or `null` for an empty field.\n\nEmpty is a real state, not a missing one: the ledger's filter opens with no\nrange set, and showing today's date there would advertise a filter that is\nnot applied.",
    },
  },
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState(args.value)
  return (
    <div style={{ width: 320 }}>
      <DateField
        {...args}
        value={value}
        onValueChange={(iso) => {
          setValue(iso)
          args.onValueChange(iso)
        }}
      />
    </div>
  )
}

/** The picker's own input, which is where the ASCII-versus-Persian trap lives. */
const field = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLInputElement>('input')!

export const Jalali: Story = {
  args: { label: 'Date received', value: new Date().toISOString(), onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Date received')

    // If this ever reads «۱۴۰۵/۰۴/۳۱» the adapter has started emitting Persian
    // digits, and the picker throws on its own section measurement.
    await expect(field(canvasElement).value).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
  },
}

export const IsNamedForScreenReaders: Story = {
  args: { label: 'Date received', value: new Date().toISOString(), onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await step('the group carries the field label', async () => {
      await expect(await canvas.findByRole('group', { name: 'Date received' })).toBeInTheDocument()
    })

    await step('and each section is named in the interface language', async () => {
      // From MUI X's own faIR catalogue, via `localeText` — not from ours.
      await expect(await canvas.findByRole('spinbutton', { name: 'سال' })).toBeInTheDocument()
      await expect(await canvas.findByRole('spinbutton', { name: 'ماه' })).toBeInTheDocument()
      await expect(await canvas.findByRole('spinbutton', { name: 'روز' })).toBeInTheDocument()
    })

    await step('the calendar opens as a NAMED dialog', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /تاریخ را انتخاب کنید/ }))
      // Portalled, so it is looked up on the document rather than the canvas.
      await expect(await body.findByRole('dialog', { name: 'Date received' })).toBeInTheDocument()
    })
  },
}

// A whole month that is unambiguously in the future, whenever the story runs.
// Seeding from today and hunting for a later day in the same grid breaks on the
// last day of a Jalali month — the flake the fixed date below already documents.
const NEXT_YEAR = (() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
})()

/** The calendar's day buttons, which are the ones `disableFuture` acts on. */
const openDays = async (canvasElement: HTMLElement): Promise<HTMLElement[]> => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)

  await userEvent.click(await canvas.findByRole('button', { name: /تاریخ را انتخاب کنید|choose date/i }))
  // The grid pads its first week with non-interactive spacers that also carry
  // the gridcell role, so the real days are the buttons.
  return (await body.findAllByRole('gridcell')).filter((day) => day.tagName === 'BUTTON')
}

export const AllowsFuture: Story = {
  args: { label: 'To date', value: NEXT_YEAR, disableFuture: false, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const days = await openDays(canvasElement)

    await expect(days.length).toBeGreaterThan(0)
    await expect(days.filter((day) => day.hasAttribute('disabled'))).toHaveLength(0)
  },
}

export const BlocksFuture: Story = {
  args: { label: 'Date received', value: NEXT_YEAR, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    const days = await openDays(canvasElement)

    await expect(days.length).toBeGreaterThan(0)
    await expect(days.filter((day) => !day.hasAttribute('disabled'))).toHaveLength(0)
  },
}

export const Empty: Story = {
  args: { label: 'From date', value: null, disableFuture: false, onValueChange: fn() },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('From date')

    await expect(field(canvasElement).value).toBe('')
  },
}

export const WithError: Story = {
  args: {
    label: 'Date received',
    value: new Date().toISOString(),
    error: true,
    helperText: 'Pick the date the money arrived.',
    onValueChange: fn(),
  },
  render: Controlled,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Pick the date the money arrived.')).toBeInTheDocument()
  },
}

export const PickingADayReportsAnIsoInstant: Story = {
  // A FIXED date, deliberately. Seeding from `new Date()` made this pass or
  // fail depending on the day it ran: `disableFuture` disables everything after
  // today, so on the 1st of a Jalali month the only enabled day IS the 1st —
  // already selected, and clicking it fires no change. It broke exactly once a
  // month and looked like flake.
  args: { label: 'Date received', value: '2026-05-15T00:00:00.000Z', onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // The calendar is portalled out of the story canvas.
    const body = within(canvasElement.ownerDocument.body)

    // Persian, because the picker's own copy now follows the interface
    // language through `localeText`.
    await userEvent.click(await canvas.findByRole('button', { name: /تاریخ را انتخاب کنید/ }))

    // The grid pads its first week with non-interactive spacers that also carry
    // the gridcell role, so the real days are the buttons.
    const days = await body.findAllByRole('gridcell')
    const firstOfTheMonth = days.find((day) => day.tagName === 'BUTTON' && !day.hasAttribute('disabled'))
    await userEvent.click(firstOfTheMonth!)

    await expect(args.onValueChange).toHaveBeenCalledTimes(1)
    await expect(args.onValueChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/))
    // And the field follows it, still in ASCII.
    await waitFor(async () => expect(field(canvasElement).value).toMatch(/^\d{4}\/\d{2}\/01$/))
  },
}

export const EnglishKeepsTheJalaliCalendar: Story = {
  args: { label: 'Date received', value: new Date(2026, 6, 22, 12).toISOString(), onValueChange: fn() },
  render: Controlled,
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText('Date received')

    // Jalali components, in the enUS field order the adapter's locale sets.
    await expect(field(canvasElement).value).toBe('04/31/1405')

    // The picker's announced copy follows the LANGUAGE, not the calendar — the
    // Jalali adapter is still in charge, but nothing is spoken in Persian.
    await expect(await canvas.findByRole('spinbutton', { name: 'Year' })).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('button', { name: /choose date/i }))

    // Transliterated, not Persian script, and not the Gregorian month either.
    await expect(await body.findByText(/Tir 1405/i)).toBeInTheDocument()
  },
}
