import { useLingui } from '@lingui/react/macro'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { SummaryCard } from './SummaryCard'

// Each story spreads its args and then falls back per field: `args.label ||
// t`Total income``.
//
// The sample copy is read from the catalog rather than written into `args`, so
// the Language toolbar still switches it — but a reader who types into Controls
// has to win, or the panel is decoration. Falling back only on a blank does both.

// Every label here is a message the APP also renders, so it exists in both
// catalogs. `lingui.config.ts` excludes stories from extraction, so a `t` on a
// string only this file uses resolves to its English id — and the fa-IR toolbar
// setting, which is the default, would show half a row in each language.
const YEAR = 1404

const meta = {
  title: 'Shared/SummaryCard',
  component: SummaryCard,
  argTypes: {
    label: { control: 'text' },
    value: {
      control: 'text',
    },
    hint: { control: 'text' },
    emphasis: {
      control: 'boolean',
    },
    icon: { control: false },
  },
  args: { label: '', value: 649980000, hint: '', emphasis: false },
} satisfies Meta<typeof SummaryCard>
export default meta
type Story = StoryObj<typeof meta>

export const Money: Story = {
  render: (args) => {
    const { t } = useLingui()
    return <SummaryCard {...args} label={args.label || t`Total income`} icon={<PaymentsRoundedIcon />} />
  },
}

export const Emphasised: Story = {
  args: { emphasis: true },
  render: (args) => {
    const { t } = useLingui()
    return <SummaryCard {...args} label={args.label || t`Total income`} icon={<PaymentsRoundedIcon />} />
  },
}

export const CountRatherThanMoney: Story = {
  args: { value: '' },
  render: (args) => {
    const { t } = useLingui()
    const { digits } = useFormat()
    return (
      <SummaryCard
        {...args}
        label={args.label || t`Receipts in ${digits(YEAR)}`}
        value={args.value || digits(13)}
        icon={<ReceiptLongRoundedIcon />}
      />
    )
  },
}

export const WithHint: Story = {
  args: { value: 54165000 },
  render: (args) => {
    const { t } = useLingui()
    const { digits } = useFormat()
    return (
      <SummaryCard
        {...args}
        label={args.label || t`Monthly average`}
        hint={args.hint || t`divided by ${digits(12)} months`}
        icon={<ShowChartRoundedIcon />}
      />
    )
  },
}

export const DashboardRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
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
  },
}
