import { useLingui } from '@lingui/react/macro'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { SummaryCard } from './SummaryCard'

const meta = {
  title: 'Shared/SummaryCard',
  component: SummaryCard,
  argTypes: {
    emphasis: { control: 'boolean' },
    value: { control: 'text' },
    icon: { control: false },
  },
} satisfies Meta<typeof SummaryCard>
export default meta
type Story = StoryObj<typeof meta>

const One = ({ emphasis }: { emphasis?: boolean }) => {
  const { t } = useLingui()
  return <SummaryCard label={t`Total income`} value={649980000} icon={<PaymentsRoundedIcon />} emphasis={emphasis} />
}

// Every label here is a message the APP also renders, so it exists in both
// catalogs. `lingui.config.ts` excludes stories from extraction, so a `t` on a
// string only this file uses resolves to its English id — and the fa-IR toolbar
// setting, which is the default, would show half a row in each language.
const YEAR = 1404

const Row = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return (
    <Grid container spacing={2} sx={{ maxWidth: 1112 }}>
      <Grid size={3}>
        <SummaryCard label={t`Income this month`} value={54165000} icon={<EventAvailableRoundedIcon />} />
      </Grid>
      <Grid size={3}>
        <SummaryCard label={t`Income in ${digits(YEAR)}`} value={649980000} icon={<PaymentsRoundedIcon />} emphasis />
      </Grid>
      <Grid size={3}>
        <SummaryCard
          label={t`Monthly average`}
          value={54165000}
          hint={t`divided by ${digits(12)} months`}
          icon={<ShowChartRoundedIcon />}
        />
      </Grid>
      <Grid size={3}>
        <SummaryCard label={t`Receipts in ${digits(YEAR)}`} value={digits(13)} icon={<ReceiptLongRoundedIcon />} />
      </Grid>
    </Grid>
  )
}

const base = { label: '', value: 0 }

export const Money: Story = { args: base, render: () => <One /> }
export const Emphasised: Story = { args: base, render: () => <One emphasis /> }

/** The dashboard's four-across row — the tiles must survive being narrow. */
export const DashboardRow: Story = { args: base, render: () => <Row /> }
