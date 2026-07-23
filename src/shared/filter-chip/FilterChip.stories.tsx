import { useLingui } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterChip } from './FilterChip'

const meta = { title: 'Shared/FilterChip', component: FilterChip } satisfies Meta<typeof FilterChip>
export default meta
type Story = StoryObj<typeof meta>

const base = { field: 'Client', value: 'Aria Trading', onDelete: fn() }

/** One applied filter, with the ✕ that undoes it. */
export const Client: Story = { args: base }

/**
 * Together these are the only visible evidence of what the popover applied.
 *
 * A composed row, so the Controls panel is switched off rather than left
 * describing a single chip that is not the one on screen. The field names go
 * through the catalog the way LedgerPage's do — the value beside them is
 * caller data and stays as it is.
 */
export const ActiveFilters: Story = {
  args: base,
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const { t } = useLingui()
    return (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <FilterChip field={t`Client`} value="Aria Trading" onDelete={args.onDelete} />
        <FilterChip field={t`Channel`} value={t`Tether`} onDelete={args.onDelete} />
      </Stack>
    )
  },
}

/**
 * The chip has to name the FIELD as well as the value.
 *
 * Two filters can share a value — a client called "Tether" and the Tether
 * channel — and a chip reading only «تتر» leaves the user unable to tell which
 * one is narrowing the ledger, which is the exact confusion the chips exist to
 * prevent.
 */
export const ShowsFieldAndValueTogether: Story = {
  args: { field: 'Channel', value: 'Tether', onDelete: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Channel: Tether')).toBeInTheDocument()
  },
}

/**
 * Removing the chip is how a filter is undone; if the ✕ does not report, the
 * user is stuck with a filtered total and only the popover to escape it.
 *
 * The ✕ is reached by role and name, not by class: MUI's clone keeps the
 * `role` and `aria-label` FilterChip sets, and FilterChip cancels `SvgIcon`'s
 * `aria-hidden` so both reach the accessibility tree. Asserting on the name is
 * what stops that combination being dropped again.
 */
export const RemovingReportsUpward: Story = {
  args: { field: 'Client', value: 'Aria Trading', onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    const remove = await canvas.findByRole('button', { name: /^حذف فیلتر Client$|^Remove the Client filter$/ })
    await userEvent.click(remove)

    await expect(args.onDelete).toHaveBeenCalledTimes(1)
  },
}
