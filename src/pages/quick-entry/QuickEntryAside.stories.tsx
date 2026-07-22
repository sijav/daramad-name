import type { Meta, StoryObj } from '@storybook/react-vite'
import { FIXTURE_CLIENTS, seedDatabase } from 'src/shared/story-fixtures'
import { expect, fn, userEvent, within } from 'storybook/test'
import { QuickEntryAside } from './QuickEntryAside'

// The panel beside the entry form: today's total, today's count, the last
// receipt, and the recent-client chips.
//
// The chips are the part worth testing. They shipped with no `onClick` at all —
// an outlined chip in a form column reads as tappable, so a user taps one,
// nothing happens, and they type the name by hand instead. That is also how a
// duplicate client gets created, which splits that client's totals across the
// ledger and halves their share in the concentration insight.

const meta = {
  title: 'Pages/QuickEntry/Aside',
  component: QuickEntryAside,
  parameters: { layout: 'padded', page: { route: '/quick-entry' } },
  beforeEach: async () => await seedDatabase(),
} satisfies Meta<typeof QuickEntryAside>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onPickClient: fn() },
}

/** Tapping a recent client hands the name back, so the form can fill itself. */
export const PickingAClientReportsTheName: Story = {
  args: { onPickClient: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const client = FIXTURE_CLIENTS[0].name

    await userEvent.click(await canvas.findByRole('button', { name: client }))

    // The exact name, not a truncated label — the form matches clients by it.
    await expect(args.onPickClient).toHaveBeenCalledWith(client)
  },
}

/**
 * With no handler the chips must not pretend to be actionable.
 *
 * `onPickClient` is optional, and a chip that renders as a button while doing
 * nothing is the defect this component already had once.
 */
export const WithoutAHandlerTheChipsAreNotButtons: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const client = FIXTURE_CLIENTS[0].name

    await expect(await canvas.findByText(client)).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: client })).toBeNull()
  },
}
