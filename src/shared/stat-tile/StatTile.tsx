import { Paper, Stack, Typography } from '@mui/material'
import { radius } from 'src/core/theme'
import { MoneyText } from 'src/shared/money-text'

export interface StatTileProps {
  label: string
  /** Toman amount, or pre-formatted text for non-money stats. */
  value: number | string
  hint?: string
  emphasis?: boolean
}

/**
 * A figure nested inside another surface — the two totals in the report
 * document, for example.
 *
 * Deliberately not a `SurfaceCard`: the design draws these as plain
 * `surface-subtle` boxes at 12px with no hairline and no shadow, because a
 * bordered elevated card inside another card reads as a stack of unrelated
 * panels. A standalone headline figure on a page is a `SummaryCard` instead.
 */
export const StatTile = ({ label, value, hint, emphasis = false }: StatTileProps) => (
  <Paper
    elevation={0}
    sx={(theme) => ({
      p: 2,
      height: '100%',
      containerType: 'inline-size',
      borderRadius: `${radius.md}px`,
      border: 'none',
      boxShadow: 'none',
      backgroundColor: emphasis ? theme.palette.primary.light : theme.palette.surfaceSubtle,
    })}
  >
    <Stack spacing={0.75}>
      <Typography variant="caption" sx={{ fontWeight: 500 }} color="text.secondary">
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
  </Paper>
)
