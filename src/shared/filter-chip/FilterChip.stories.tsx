import { useLingui } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterChip } from './FilterChip'

const meta = { title: 'Shared/FilterChip', component: FilterChip } satisfies Meta<typeof FilterChip>
export default meta
type Story = StoryObj<typeof meta>

const Single = () => {
  const { t } = useLingui()
  return <FilterChip field={t`Client`} value="Aria Trading" onDelete={() => {}} />
}

/** Together these are the only visible evidence of what the popover applied. */
const Row = () => {
  const { t } = useLingui()
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <FilterChip field={t`Client`} value="Aria Trading" onDelete={() => {}} />
      <FilterChip field={t`Channel`} value={t`Tether`} onDelete={() => {}} />
    </Stack>
  )
}

const base = { field: '', value: '' }

export const Client: Story = { args: base, render: () => <Single /> }
export const ActiveFilters: Story = { args: base, render: () => <Row /> }

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
 * NOTE: the ✕ is queried by class, not by role. MUI clones the `deleteIcon`
 * with an `onClick` and no accessible name at all, so there is no role or label
 * to query — see the findings for this run.
 */
export const RemovingReportsUpward: Story = {
  args: { field: 'Client', value: 'Aria Trading', onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = (await canvas.findByText('Client: Aria Trading')).closest('.MuiChip-root')
    const remove = chip?.querySelector('.MuiChip-deleteIcon')

    await expect(remove).not.toBeNull()
    await userEvent.click(remove as Element)
    await expect(args.onDelete).toHaveBeenCalledTimes(1)
  },
}
