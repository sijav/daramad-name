import { useLingui } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterChip } from './FilterChip'

const meta = {
  title: 'Shared/FilterChip',
  component: FilterChip,
  argTypes: {
    field: { control: 'text' },
  },
} satisfies Meta<typeof FilterChip>
export default meta
type Story = StoryObj<typeof meta>

const base = { field: 'Client', value: 'Aria Trading', onDelete: fn() }

export const Client: Story = { args: base }

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

export const ShowsFieldAndValueTogether: Story = {
  args: { field: 'Channel', value: 'Tether', onDelete: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Channel: Tether')).toBeInTheDocument()
  },
}

export const RemovingReportsUpward: Story = {
  args: { field: 'Client', value: 'Aria Trading', onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    const remove = await canvas.findByRole('button', { name: /^حذف فیلتر Client$|^Remove the Client filter$/ })
    await userEvent.click(remove)

    await expect(args.onDelete).toHaveBeenCalledTimes(1)
  },
}
