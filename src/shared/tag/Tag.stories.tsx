import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag } from './Tag'

const meta = { title: 'Shared/Tag', component: Tag } satisfies Meta<typeof Tag>
export default meta
type Story = StoryObj<typeof meta>

/** The default read-only pill, used for a receipt's payment channel. */
export const Channel: Story = { args: { label: 'کارت به کارت' } }

/** `primary` marks the frozen conversion on the receipt details drawer. */
export const Frozen: Story = {
  args: { label: 'فریزشده', tone: 'primary', icon: <LockRoundedIcon sx={{ fontSize: 14 }} /> },
}

export const AllTones: Story = {
  args: { label: '' },
  render: () => (
    <Stack direction="row" spacing={1}>
      <Tag label="Neutral" />
      <Tag label="Primary" tone="primary" />
      <Tag label="Success" tone="success" />
      <Tag label="Warning" tone="warning" />
    </Stack>
  ),
}
