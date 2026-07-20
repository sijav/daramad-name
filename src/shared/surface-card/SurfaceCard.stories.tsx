import { Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from './SurfaceCard'

const meta = {
  title: 'Shared/SurfaceCard',
  component: SurfaceCard,
} satisfies Meta<typeof SurfaceCard>

export default meta
type Story = StoryObj<typeof meta>

/** The frosted surface from the design: 28px radius, 16px backdrop blur, soft drop shadow. */
export const Default: Story = {
  args: {
    children: (
      <Stack spacing={1}>
        <Typography variant="h2">Record a receipt</Typography>
        <Typography variant="body2" color="text.secondary">
          Log it in under 15 seconds
        </Typography>
      </Stack>
    ),
    sx: { maxWidth: 520 },
  },
}

/** `flat` drops the shadow, for cards nested inside another surface. */
export const Flat: Story = {
  args: { ...Default.args, flat: true },
}
