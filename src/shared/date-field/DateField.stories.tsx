import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { DateField } from './DateField'

const meta = {
  title: 'Shared/DateField',
  component: DateField,
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

/**
 * Jalali picker. The digits look Persian but the DOM value stays ASCII — MUI X
 * measures each field section against ASCII '0', so the Persian numerals come
 * from Vazirmatn's Farsi-Digits cut rather than from the adapter.
 */
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

/**
 * Everything a screen reader is given, asserted in one place.
 *
 * The picker is not a text box: it renders `role="group"` around three
 * `role="spinbutton"` sections, and a group is not a labelable element — so the
 * `<label>` `Field` wraps the control in names the picker's hidden input and
 * leaves the visible group anonymous. Both halves used to be wrong at once: the
 * group had no name, and the section names came from MUI X's untranslated
 * default, so a Persian interface announced "Year", "Month", "Day".
 */
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

/** Filters allow future dates; the receipt form does not. */
export const AllowsFuture: Story = {
  args: { label: 'To date', value: new Date().toISOString(), disableFuture: false, onValueChange: fn() },
  render: Controlled,
}

/**
 * Empty is a real state, not a missing one. The ledger's filter opens with no
 * range set, and defaulting to today there would advertise a filter that is not
 * actually applied.
 */
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

/**
 * Choosing a day hands the caller an ISO INSTANT, not a Jalali string. That is
 * what makes the calendar a display setting: switching to Gregorian in Settings
 * re-reads the same stored value rather than rewriting any data.
 */
export const PickingADayReportsAnIsoInstant: Story = {
  args: { label: 'Date received', value: new Date().toISOString(), onValueChange: fn() },
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

/**
 * The calendar system is a separate setting from the language, so an English
 * interface still gets the Jalali calendar — with `date-fns-jalali`'s enUS
 * locale, which transliterates the month names. Printing «تیر» to a reader who
 * chose English is the whole reason that locale is passed.
 */
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
