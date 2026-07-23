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
    label: { control: 'text', description: 'The text on the pill.' },
    tone: {
      control: 'inline-radio',
      options: TONES,
      description: 'Which palette role the pill paints in. Defaults to the bordered neutral.',
    },
    icon: { control: false, description: 'Optional leading glyph, sized to the caption text.' },
    size: { table: { disable: true } },
  },
  args: { label: 'کارت به کارت', tone: 'neutral' },
} satisfies Meta<typeof Tag>
export default meta
type Story = StoryObj<typeof meta>

/** The default read-only pill, used for a receipt's payment channel. */
export const Channel: Story = {}

/** `primary` marks the frozen conversion on the receipt details drawer. */
export const Frozen: Story = {
  args: { label: 'فریزشده', tone: 'primary', icon: <LockRoundedIcon sx={{ fontSize: 14 }} /> },
}

/**
 * All four tones at once, for comparison.
 *
 * The gallery still renders from args — change the label or the icon and every
 * pill follows — so this is a view of the same component, not a second one that
 * happens to look like it.
 */
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
