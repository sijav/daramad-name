import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Field } from 'src/shared/field'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ChipSelect } from './ChipSelect'

const CHANNELS = [
  { value: 'CARD_TO_CARD', label: 'Card to card' },
  { value: 'REMITTANCE', label: 'Wire transfer' },
  { value: 'TETHER', label: 'Tether' },
  { value: 'OTHER', label: 'Other' },
]

const meta = {
  title: 'Shared/ChipSelect',
  component: ChipSelect,
  argTypes: {
    // Free text here deselects every pill, because `selected` is an equality
    // check against the option values.
    value: { control: 'select', options: CHANNELS.map((channel) => channel.value) },
  },
} satisfies Meta<typeof ChipSelect<string>>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controlled like the form controls it, and the spy from `args` is called too:
 * assigning `setValue` straight to `onValueChange` would replace the spy for
 * every story sharing this render.
 */
const Controlled: Story['render'] = function Render(args) {
  const [value, setValue] = useState(args.value)
  return (
    <ChipSelect
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        args.onValueChange(next)
      }}
    />
  )
}

/** The receipt channel picker. The selected pill takes the primary container fill. */
export const Channels: Story = {
  args: { label: 'Payment channel', value: 'TETHER', options: CHANNELS, onValueChange: fn() },
  render: Controlled,
}

/**
 * Inside a `Field` that already prints a label, so the row draws no caption of
 * its own.
 *
 * `role="radiogroup"` is not a labelable element — the wrapping `<label>` that
 * names every other control in the form does not reach it — so the group points
 * at the label text by id instead, the way `DateField` names MUI X's picker.
 * The earlier version of this story simply omitted the label, which left the
 * group with no accessible name at all.
 */
export const LabelledByTheFieldAround: Story = {
  args: { value: 'CARD_TO_CARD', options: CHANNELS, labelId: 'channel-label', onValueChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <Field label="Payment channel" labelId="channel-label">
        <ChipSelect
          {...args}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            args.onValueChange(next)
          }}
        />
      </Field>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('radiogroup', { name: 'Payment channel' })).toBeInTheDocument()
  },
}

/**
 * More channels than fit on one line. The row wraps rather than scrolling or
 * squeezing the pills — `flexWrap` on the group exists for exactly this, and
 * nothing else exercised it. Arrow traversal follows the options, not the
 * visual rows, so it keeps working across the wrap.
 */
export const WrapsOntoASecondRow: Story = {
  args: {
    label: 'Payment channel',
    value: 'CHEQUE',
    options: [
      ...CHANNELS,
      { value: 'CHEQUE', label: 'Cheque' },
      { value: 'CASH', label: 'Cash in hand' },
      { value: 'PAYPAL', label: 'PayPal' },
      { value: 'WISE', label: 'Wise' },
      { value: 'STRIPE', label: 'Stripe payout' },
    ],
    onValueChange: fn(),
  },
  render: Controlled,
}

/**
 * The group is named, the caption is not a heading, and a focused pill is
 * visible.
 *
 * All three were wrong. MUI maps the `subtitle2` variant onto `<h6>`, so
 * "Payment channel" was announced as a level-6 heading in the middle of the
 * record card. And the component paints both the selected and the unselected
 * fill itself, which beat MUI's own focus-visible background — a keyboard user
 * tabbing across the channels saw nothing move at all, so the theme now draws a
 * real ring.
 */
export const IsNamedAndShowsFocus: Story = {
  ...Channels,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the row is a named radiogroup', async () => {
      await expect(await canvas.findByRole('radiogroup', { name: 'Payment channel' })).toBeInTheDocument()
    })

    await step('the caption is a caption', async () => {
      await expect(canvas.queryAllByRole('heading')).toHaveLength(0)
    })

    await step('and a focused pill is ringed rather than silent', async () => {
      const pill = await canvas.findByRole('radio', { name: 'Card to card' })
      // The theme's contract starts at the class MUI adds; this asserts the
      // ring exists once it is there, rather than re-testing MUI's own
      // focus-visible heuristic.
      await userEvent.click(pill)
      pill.classList.add('Mui-focusVisible')

      const ring = canvasElement.ownerDocument.defaultView!.getComputedStyle(pill)
      await expect(ring.outlineStyle).toBe('solid')
      await expect(ring.outlineWidth).toBe('2px')
    })
  },
}

/**
 * A `radiogroup` is one tab stop with arrows moving between its radios, and
 * saying so in the roles is a promise to a screen-reader user. The group used
 * to make every pill its own tab stop and ignore the arrow keys entirely, so
 * the announcement told people to press keys that did nothing.
 */
export const ArrowKeysMoveTheSelection: Story = {
  args: { label: 'Payment channel', value: 'CARD_TO_CARD', options: CHANNELS, onValueChange: fn() },
  render: Controlled,
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    // The row is laid out along the reading direction, so which arrow means
    // "next" depends on the locale the story is rendered in.
    const forward = view.getComputedStyle(canvasElement).direction === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}'

    const cardToCard = await canvas.findByRole('radio', { name: 'Card to card' })
    const wire = await canvas.findByRole('radio', { name: 'Wire transfer' })

    await step('Tab reaches the group once, landing on the current choice', async () => {
      await expect(cardToCard).toHaveAttribute('tabindex', '0')
      await expect(wire).toHaveAttribute('tabindex', '-1')
    })

    await step('an arrow along the row moves both the focus and the selection', async () => {
      cardToCard.focus()
      await userEvent.keyboard(forward)

      await expect(args.onValueChange).toHaveBeenLastCalledWith('REMITTANCE')
      await expect(wire).toHaveFocus()
      await expect(wire).toHaveAttribute('aria-checked', 'true')
      await expect(cardToCard).toHaveAttribute('aria-checked', 'false')
    })

    await step('End goes to the last pill and the next arrow wraps round', async () => {
      await userEvent.keyboard('{End}')
      await expect(await canvas.findByRole('radio', { name: 'Other' })).toHaveFocus()

      await userEvent.keyboard('{ArrowDown}')
      await expect(cardToCard).toHaveFocus()
      await expect(args.onValueChange).toHaveBeenLastCalledWith('CARD_TO_CARD')
    })
  },
}
