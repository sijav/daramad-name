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
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
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
        // `component="p"` for the same reason `MoneyText` renders a span: this
        // is the tile's figure, not a heading. The `h3` variant is only how
        // large the design draws it.
        <Typography variant="h3" component="p">
          {value}
        </Typography>
      )}

      {hint ? (
        <Typography sx={{ color: 'text.secondary' }} variant="caption">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
)
