import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SegmentedControl } from './SegmentedControl'

const meta = {
  title: 'Shared/SegmentedControl',
  component: SegmentedControl,
  argTypes: {
    variant: { control: 'inline-radio', options: ['filled', 'subtle'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof SegmentedControl<string>>

export default meta
type Story = StoryObj<typeof meta>

/** The currency picker from the record card: a filled primary pill on a recessed track. */
export const Currency: Story = {
  args: {
    value: 'USDT',
    options: [
      { value: 'USDT', label: 'Tether' },
      { value: 'USD', label: 'USD' },
      { value: 'TOMAN', label: 'Toman' },
    ],
    onValueChange: fn(),
  },
  // Controlled so the pill moves, but the spy from `args` is called too — a
  // bare `setValue` here would replace it and every story sharing this render
  // would report nothing to the Actions panel.
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <SegmentedControl
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          args.onValueChange(next)
        }}
      />
    )
  },
}

/** Two segments — the report's language switch. */
export const TwoOptions: Story = {
  ...Currency,
  args: {
    value: 'fa',
    options: [
      { value: 'fa', label: 'Persian' },
      { value: 'en', label: 'English' },
    ],
    onValueChange: fn(),
  },
}

/** The report config's lighter treatment: a recessed track with a raised segment. */
export const Subtle: Story = {
  ...Currency,
  args: {
    value: 'fa',
    variant: 'subtle',
    options: [
      { value: 'fa', label: 'Persian' },
      { value: 'en', label: 'English' },
    ],
    onValueChange: fn(),
  },
}

/**
 * `disabled` is not a prop this component declares — it rides the rest spread
 * through to `ToggleButtonGroup`. No page passes it yet, so this story is the
 * only thing showing what the state looks like and the only proof that the
 * spread reaches the group at all.
 */
export const Disabled: Story = {
  ...Currency,
  args: {
    value: 'USDT',
    disabled: true,
    options: [
      { value: 'USDT', label: 'Tether' },
      { value: 'USD', label: 'USD' },
      { value: 'TOMAN', label: 'Toman' },
    ],
    onValueChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Every segment, not just the unselected ones — a half-disabled group would
    // still let the user change the currency.
    for (const name of ['Tether', 'USD', 'Toman']) {
      await expect(await canvas.findByRole('button', { name })).toBeDisabled()
    }
  },
}

/**
 * A focused segment has to be visible.
 *
 * `ButtonBase` paints no focus indicator of its own, and this control sets the
 * selected segment's background itself — which overwrote the one state MUI does
 * express. Tabbing across the currency switch moved nothing on screen. The
 * theme now gives `ToggleButton` the same `border-focus` ring Button and
 * IconButton already had.
 */
export const AFocusedSegmentIsRinged: Story = {
  ...Currency,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const segment = await canvas.findByRole('button', { name: 'Toman' })

    // Asserted from the class MUI adds rather than by simulating a keyboard
    // walk: whether `:focus-visible` matches is the browser's heuristic, and
    // what is under test here is the theme rule it triggers.
    segment.classList.add('Mui-focusVisible')

    const ring = canvasElement.ownerDocument.defaultView!.getComputedStyle(segment)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineWidth).toBe('2px')
    // `border-focus` #3460d6 — not `primary.main` #3b6ef5, the other blue.
    await expect(ring.outlineColor).toBe('rgb(52, 96, 214)')
  },
}

/**
 * A segmented control can never end up with nothing selected. `ToggleButtonGroup`
 * reports `null` when the user clicks the segment that is already on — taking
 * that at face value would leave the currency unset, and an unset currency means
 * an amount with no meaning.
 */
export const ClickingTheSelectedSegmentIsIgnored: Story = {
  args: {
    value: 'USDT',
    options: [
      { value: 'USDT', label: 'Tether' },
      { value: 'USD', label: 'USD' },
      { value: 'TOMAN', label: 'Toman' },
    ],
    onValueChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <SegmentedControl
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          args.onValueChange(next)
        }}
      />
    )
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const tether = await canvas.findByRole('button', { name: 'Tether' })
    await expect(tether).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(tether)

    // Nothing reported, and Tether is still the selection.
    await expect(args.onValueChange).not.toHaveBeenCalled()
    await expect(tether).toHaveAttribute('aria-pressed', 'true')

    // A different segment does report, exactly once.
    await userEvent.click(await canvas.findByRole('button', { name: 'Toman' }))
    await expect(args.onValueChange).toHaveBeenCalledTimes(1)
    await expect(args.onValueChange).toHaveBeenLastCalledWith('TOMAN')
    await expect(tether).toHaveAttribute('aria-pressed', 'false')
  },
}
