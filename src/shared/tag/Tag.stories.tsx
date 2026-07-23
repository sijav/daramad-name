import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag, type TagTone } from './Tag'

const TONES: TagTone[] = ['neutral', 'primary', 'success', 'warning']

const meta = {
  title: 'Shared/Tag',
  component: Tag,
  // `Tag` forwards the rest of `ChipProps`, so docgen offers MUI's entire chip
  // surface. Only the four that mean something here are listed, which keeps the
  // Controls panel to the props a reader would actually turn.
  //
  // The descriptions live here, beside the stories that demonstrate them, and
  // the Persian for each one is in `story-docs/fa/shared-tag.md`.
  argTypes: {
    label: { control: 'text' },
    tone: {
      control: 'inline-radio',
      options: TONES,
    },
    icon: { control: false },
    size: { table: { disable: true } },
  },
  args: { label: 'کارت به کارت', tone: 'neutral' },
} satisfies Meta<typeof Tag>
export default meta
type Story = StoryObj<typeof meta>

export const Channel: Story = {}

export const Frozen: Story = {
  args: { label: 'فریزشده', tone: 'primary', icon: <LockRoundedIcon sx={{ fontSize: 14 }} /> },
}

export const AllTones: Story = {
  argTypes: { tone: { table: { disable: true } } },
  render: ({ label, ...args }) => (
    <Stack direction="row" spacing={1}>
      {TONES.map((tone) => (
        <Tag key={tone} {...args} label={label || tone} tone={tone} />
      ))}
    </Stack>
  ),
}
