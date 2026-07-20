import { Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from './SurfaceCard'

const meta = {
  title: 'Shared/SurfaceCard',
  component: SurfaceCard,
} satisfies Meta<typeof SurfaceCard>

export default meta
type Story = StoryObj<typeof meta>

const body = (
  <Stack spacing={1}>
    <Typography variant="h3">Record a receipt</Typography>
    <Typography sx={{ color: 'text.secondary' }} variant="body2">
      Log it in under 15 seconds
    </Typography>
  </Stack>
)

/** The design's panel: `surface-default`, a 1px hairline, 20px, Elevation/1. */
export const Default: Story = { args: { children: body, sx: { maxWidth: 520 } } }

/** `radius="lg"` is the 16px supporting panel — Settings, Report, Quick Entry's aside. */
export const Supporting: Story = { args: { ...Default.args, radius: 'lg' } }

/** `flat` drops the shadow. Ledger, Report and Settings panels carry none. */
export const Flat: Story = { args: { ...Default.args, flat: true } }

/** `tone="subtle"` is the tinted panel behind the dashboard's report shortcut. */
export const Subtle: Story = { args: { ...Default.args, tone: 'subtle', flat: true } }
