import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilterChip } from './FilterChip'

const meta = { title: 'Shared/FilterChip', component: FilterChip } satisfies Meta<typeof FilterChip>
export default meta
type Story = StoryObj<typeof meta>

export const Client: Story = { args: { field: 'مشتری', value: 'بازرگانی آریا', onDelete: () => {} } }

/** Together these are the only visible evidence of what the popover applied. */
export const Row: Story = {
  args: { field: '', value: '' },
  render: () => (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <FilterChip field="بازه" value="۱ فروردین ۱۴۰۵ – ۲۹ اسفند ۱۴۰۵" onDelete={() => {}} />
      <FilterChip field="مشتری" value="بازرگانی آریا" onDelete={() => {}} />
      <FilterChip field="کانال" value="تتر" onDelete={() => {}} />
    </Stack>
  ),
}
