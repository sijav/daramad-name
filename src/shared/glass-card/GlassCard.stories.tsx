import { Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from './GlassCard'

const meta = {
  title: 'Shared/GlassCard',
  component: GlassCard,
} satisfies Meta<typeof GlassCard>

export default meta
type Story = StoryObj<typeof meta>

/** The frosted surface from the design: 28px radius, 16px backdrop blur, soft drop shadow. */
export const Default: Story = {
  args: {
    children: (
      <Stack spacing={1}>
        <Typography variant="h2">ثبت دریافتی</Typography>
        <Typography variant="body2" color="text.secondary">
          کمتر از ۱۵ ثانیه ثبتش کن
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
