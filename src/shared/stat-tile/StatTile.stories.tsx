import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatTile } from './StatTile'

const meta = {
  title: 'Shared/StatTile',
  component: StatTile,
} satisfies Meta<typeof StatTile>

export default meta
type Story = StoryObj<typeof meta>

/** A numeric value is rendered as money, with the unit and Persian digits. */
export const Money: Story = {
  args: { label: 'جمع کل', value: 649980000 },
}

/** `emphasis` fills the tile with the primary container colour — used for the headline figure. */
export const Emphasised: Story = {
  args: { label: 'جمع کل', value: 649980000, emphasis: true },
}

/** A string value bypasses money formatting, for counts and ratios. */
export const Count: Story = {
  args: { label: 'ماه‌های دارای درآمد', value: '۴ از ۱۲' },
}

export const WithHint: Story = {
  args: {
    label: 'میانگین درآمد ماهانه',
    value: 26844167,
    hint: 'تقسیم بر تعداد ماه‌های بازه، نه فقط ماه‌های دارای درآمد',
  },
}

export const Row: Story = {
  args: { label: '', value: 0 },
  render: () => (
    <Grid container spacing={2} sx={{ maxWidth: 800 }}>
      <Grid size={4}>
        <StatTile label="جمع کل" value={649980000} emphasis />
      </Grid>
      <Grid size={4}>
        <StatTile label="میانگین ماهانه" value={59089091} />
      </Grid>
      <Grid size={4}>
        <StatTile label="تعداد دریافتی" value="۱۳" />
      </Grid>
    </Grid>
  ),
}
