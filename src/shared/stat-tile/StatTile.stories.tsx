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
  args: { label: 'Total', value: 649980000 },
}

/** `emphasis` fills the tile with the primary container colour — used for the headline figure. */
export const Emphasised: Story = {
  args: { label: 'Total', value: 649980000, emphasis: true },
}

/** A string value bypasses money formatting, for counts and ratios. */
export const Count: Story = {
  args: { label: 'Months with income', value: '4 of 12' },
}

export const WithHint: Story = {
  args: {
    label: 'Average monthly income',
    value: 26844167,
    hint: 'Divided by the months in the range, not only the months with income',
  },
}

export const Row: Story = {
  args: { label: '', value: 0 },
  render: () => (
    <Grid container spacing={2} sx={{ maxWidth: 800 }}>
      <Grid size={4}>
        <StatTile label="Total" value={649980000} emphasis />
      </Grid>
      <Grid size={4}>
        <StatTile label="Monthly average" value={59089091} />
      </Grid>
      <Grid size={4}>
        <StatTile label="Receipts" value="13" />
      </Grid>
    </Grid>
  ),
}
