import { useLingui } from '@lingui/react/macro'
import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { SummaryCard } from './SummaryCard'

const meta = { title: 'Shared/SummaryCard', component: SummaryCard } satisfies Meta<typeof SummaryCard>
export default meta
type Story = StoryObj<typeof meta>

const One = ({ emphasis }: { emphasis?: boolean }) => {
  const { t } = useLingui()
  return <SummaryCard label={t`Total income`} value={649980000} emphasis={emphasis} />
}

const Row = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return (
    <Grid container spacing={2} sx={{ maxWidth: 1112 }}>
      <Grid size={3}>
        <SummaryCard label={t`Total income`} value={649980000} emphasis />
      </Grid>
      <Grid size={3}>
        <SummaryCard label={t`Monthly average`} value={54165000} />
      </Grid>
      <Grid size={3}>
        <SummaryCard label={t`Months with income`} value={t`${digits(4)} of 12`} />
      </Grid>
      <Grid size={3}>
        <SummaryCard label={t`Clients`} value={digits(4)} />
      </Grid>
    </Grid>
  )
}

const base = { label: '', value: 0 }

export const Money: Story = { args: base, render: () => <One /> }
export const Emphasised: Story = { args: base, render: () => <One emphasis /> }

/** The dashboard's four-across row — the tiles must survive being narrow. */
export const DashboardRow: Story = { args: base, render: () => <Row /> }
