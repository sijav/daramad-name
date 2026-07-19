import { Stack, Typography } from '@mui/material'
import { GlassCard } from 'src/shared/glass-card'
import { MoneyText } from 'src/shared/money-text'

export interface StatTileProps {
  label: string
  /** Toman amount, or pre-formatted text for non-money stats. */
  value: number | string
  hint?: string
  emphasis?: boolean
}

/** A single headline number — total income, monthly average, receipt count. */
export const StatTile = ({ label, value, hint, emphasis = false }: StatTileProps) => (
  <GlassCard
    flat
    sx={(theme) => ({
      p: 2.5,
      height: '100%',
      ...(emphasis && {
        backgroundColor: theme.palette.primary.light,
        borderColor: theme.palette.primary.main,
      }),
    })}
  >
    <Stack spacing={0.75}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>

      {typeof value === 'number' ? (
        <MoneyText value={value} variant="h3" sx={{ display: 'block' }} />
      ) : (
        <Typography variant="h3">{value}</Typography>
      )}

      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </GlassCard>
)
