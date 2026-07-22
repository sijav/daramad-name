import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ChipSelect } from './ChipSelect'

const meta = {
  title: 'Shared/ChipSelect',
  component: ChipSelect,
} satisfies Meta<typeof ChipSelect<string>>

export default meta
type Story = StoryObj<typeof meta>

const CHANNELS = [
  { value: 'CARD_TO_CARD', label: 'Card to card' },
  { value: 'REMITTANCE', label: 'Wire transfer' },
  { value: 'TETHER', label: 'Tether' },
  { value: 'OTHER', label: 'Other' },
]

/** The receipt channel picker. The selected pill takes the primary container fill. */
export const Channels: Story = {
  args: { label: 'Payment channel', value: 'TETHER', options: CHANNELS, onValueChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <ChipSelect {...args} value={value} onValueChange={setValue} />
  },
}

/** Without a label, for use inside a field that already has one. */
export const Unlabelled: Story = {
  ...Channels,
  args: { value: 'CARD_TO_CARD', options: CHANNELS, onValueChange: fn() },
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
