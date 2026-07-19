import { useLingui } from '@lingui/react/macro'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
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
