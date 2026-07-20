import { Stack, Typography } from '@mui/material'
import { MoneyText } from 'src/shared/money-text'
import { SurfaceCard } from 'src/shared/surface-card'

export interface StatTileProps {
  label: string
  /** Toman amount, or pre-formatted text for non-money stats. */
  value: number | string
  hint?: string
  emphasis?: boolean
}

/** A single headline number — total income, monthly average, receipt count. */
export const StatTile = ({ label, value, hint, emphasis = false }: StatTileProps) => (
  <SurfaceCard
    flat
    sx={(theme) => ({
      p: 2.5,
      height: '100%',
      containerType: 'inline-size',
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
        // English labels are longer than Persian, so the figure has to be allowed
        // to shrink rather than overflow the tile.
        <MoneyText
          value={value}
          variant="h3"
          sx={{ display: 'block', whiteSpace: 'normal', overflowWrap: 'anywhere', fontSize: 'clamp(1rem, 4.2cqw, 1.25rem)' }}
        />
      ) : (
        <Typography variant="h3">{value}</Typography>
      )}

      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </SurfaceCard>
)
