import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SummaryCard } from './SummaryCard'

const meta = { title: 'Shared/SummaryCard', component: SummaryCard } satisfies Meta<typeof SummaryCard>
export default meta
type Story = StoryObj<typeof meta>

export const Money: Story = { args: { label: 'جمع کل درآمد', value: 649980000 } }
export const Emphasised: Story = { args: { label: 'جمع کل درآمد', value: 649980000, emphasis: true } }
export const Count: Story = { args: { label: 'ماه‌های دارای درآمد', value: '۴ از ۱۲' } }

/** The dashboard's four-across row — the tiles must survive being narrow. */
export const DashboardRow: Story = {
  args: { label: '', value: 0 },
  render: () => (
    <Grid container spacing={2} sx={{ maxWidth: 1112 }}>
      <Grid size={3}>
        <SummaryCard label="جمع کل درآمد" value={649980000} emphasis />
      </Grid>
      <Grid size={3}>
        <SummaryCard label="میانگین ماهانه" value={54165000} />
      </Grid>
      <Grid size={3}>
        <SummaryCard label="ماه‌های دارای درآمد" value="۴ از ۱۲" />
      </Grid>
      <Grid size={3}>
        <SummaryCard label="مشتری‌ها" value="۴" />
      </Grid>
    </Grid>
  ),
}
