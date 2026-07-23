import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { RangeSelect } from './RangeSelect'

const meta = {
  title: 'Shared/RangeSelect',
  component: RangeSelect,
  argTypes: {
    prefix: { description: 'Prefixed to the selected label, e.g. "Report range: year 1403".' },
    onSelect: { description: 'The chosen value, always as a string: it arrives from a DOM select.' },
    options: { description: 'Every choice, in the order they should appear. Newest first, for years.' },
    value: {
      description:
        "The selected option's value.\n\nMUI renders NOTHING — no label, no fallback — when this is absent from\n`options`, so callers fold the selection in rather than letting the two\ndisagree. See `selectableYears`.",
      control: 'select',
      options: [1403, 1402],
    },
  },
} satisfies Meta<typeof RangeSelect>

export default meta
type Story = StoryObj<typeof meta>

/** The pill in every page header — chevron on the trailing edge, label inline. */
export const Default: Story = {
  args: {
    value: 1403,
    prefix: 'بازه گزارش',
    options: [
      { value: 1403, label: '۱۴۰۳' },
      { value: 1402, label: '۱۴۰۲' },
    ],
    onSelect: fn(),
  },
  // Seeded from `args.value` so the control is live, and the spy is called
  // alongside the setter — replacing it with `setYear` would leave the Actions
  // panel silent and the plays with nothing to assert on.
  render: function Render(args) {
    const [year, setYear] = useState(String(args.value))
    return (
      <RangeSelect
        {...args}
        value={year}
        onSelect={(next) => {
          setYear(next)
          args.onSelect(next)
        }}
      />
    )
  },
}

/**
 * The pill has no label above it, and `role="combobox"` does NOT take its name
 * from the text inside it — so the control announced nothing at all, which axe
 * reports as `aria-input-field-name` (serious). `prefix` is already the label
 * the design prints in the pill, so it names the control too and the visible
 * text cannot drift away from the spoken one.
 */
export const IsNamedForScreenReaders: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('combobox', { name: 'بازه گزارش' })).toBeInTheDocument()
  },
}

/**
 * The pill prints `prefix: label`, not the raw value. The distinction is the
 * whole point of `renderValue`: the year is stored as 1403 and shown as ۱۴۰۳,
 * so a control that fell back to the value would print Latin digits in the
 * middle of a Persian header.
 */
export const ShowsTheComposedLabelAndReportsTheChoice: Story = {
  ...Default,
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The menu is portalled out of the canvas, so its options live on `body`.
    const body = within(canvasElement.ownerDocument.body)
    const trigger = await canvas.findByRole('combobox', { name: 'بازه گزارش' })

    await step('the trigger reads prefix then label', async () => {
      await expect(trigger).toHaveTextContent('بازه گزارش: ۱۴۰۳')
    })

    await step('picking another year reports it as a string', async () => {
      await userEvent.click(trigger)
      await userEvent.click(await body.findByRole('option', { name: '۱۴۰۲' }))

      // A string, because that is what `event.target.value` carries — every
      // caller converts it back itself.
      await expect(args.onSelect).toHaveBeenLastCalledWith('1402')
      await waitFor(() => expect(trigger).toHaveTextContent('بازه گزارش: ۱۴۰۲'))
    })
  },
}
