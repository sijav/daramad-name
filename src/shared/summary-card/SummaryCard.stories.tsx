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
    label: { control: 'text', description: 'The caption above the figure. Left blank, each story falls back to its translated sample.' },
    value: {
      control: 'text',
      description: 'A number renders as money through `MoneyText`; a string renders verbatim, for counts that are not amounts.',
    },
    hint: { control: 'text', description: 'A line under the figure saying how it was derived — the averaging basis, on the report.' },
    emphasis: {
      control: 'boolean',
      description: 'Paints the card in `primary.light`. At most one tile per row, or nothing is emphasised.',
    },
    icon: { control: false, description: 'Shown in a 36px tinted chip beside the label.' },
  },
  args: { label: '', value: 649980000, hint: '', emphasis: false },
} satisfies Meta<typeof SummaryCard>
export default meta
type Story = StoryObj<typeof meta>

/** The default tile: a money figure, its caption, and the icon chip. */
export const Money: Story = {
  render: (args) => {
    const { t } = useLingui()
    return <SummaryCard {...args} label={args.label || t`Total income`} icon={<PaymentsRoundedIcon />} />
  },
}

/** The emphasised tile — the one figure on a row that answers the page's question. */
export const Emphasised: Story = {
  args: { emphasis: true },
  render: (args) => {
    const { t } = useLingui()
    return <SummaryCard {...args} label={args.label || t`Total income`} icon={<PaymentsRoundedIcon />} />
  },
}

/**
 * `value` as a string: a receipt COUNT is not money, so it must not be grouped
 * or given a currency — but it still has to be in the reader's digits, which is
 * why the caller formats it rather than passing a bare number.
 */
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

/**
 * The hint line. On the report this is where the averaging basis is stated — a
 * figure whose derivation is not on the page is a figure nobody can check.
 */
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

/**
 * The dashboard's four-across row — the tiles must survive being narrow.
 *
 * A composition of four different cards, so there is no single card for the
 * Controls panel to drive. It is switched off here rather than left looking
 * live and doing nothing.
 */
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
