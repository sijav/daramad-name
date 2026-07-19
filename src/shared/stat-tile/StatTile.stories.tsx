import { useLingui } from '@lingui/react/macro'
import { Grid } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { StatTile } from './StatTile'

const meta = { title: 'Shared/StatTile', component: StatTile } satisfies Meta<typeof StatTile>
export default meta
type Story = StoryObj<typeof meta>

// Story copy goes through the catalog so the Language toolbar switches it along
// with the component's own text.
const Money = () => {
  const { t } = useLingui()
  return <StatTile label={t`Total`} value={649980000} />
}

const Emphasis = () => {
  const { t } = useLingui()
  return <StatTile label={t`Total`} value={649980000} emphasis />
}

const Count = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return <StatTile label={t`Months with income`} value={t`${digits(4)} of 12`} />
}

const Hinted = () => {
  const { t } = useLingui()
  return (
    <StatTile
      label={t`Average monthly income`}
      value={26844167}
      hint={t`Divided by the months in the range, not only the months with income`}
    />
  )
}

const Row = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return (
    <Grid container spacing={2} sx={{ maxWidth: 800 }}>
      <Grid size={4}>
        <StatTile label={t`Total`} value={649980000} emphasis />
      </Grid>
      <Grid size={4}>
        <StatTile label={t`Monthly average`} value={59089091} />
      </Grid>
      <Grid size={4}>
        <StatTile label={t`Receipts`} value={digits(13)} />
      </Grid>
    </Grid>
  )
}

const base = { label: '', value: 0 }

/** A numeric value renders as money, with the unit and locale-correct digits. */
export const MoneyValue: Story = { args: base, render: () => <Money /> }

/** `emphasis` fills the tile with the primary container colour — the headline figure. */
export const Emphasised: Story = { args: base, render: () => <Emphasis /> }

/** A string value bypasses money formatting, for counts and ratios. */
export const CountValue: Story = { args: base, render: () => <Count /> }

export const WithHint: Story = { args: base, render: () => <Hinted /> }

/** The ledger's three-across row — tiles must survive being narrow in either language. */
export const ThreeAcross: Story = { args: base, render: () => <Row /> }
