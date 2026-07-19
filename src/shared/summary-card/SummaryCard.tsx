import { Stack, Typography } from '@mui/material'
import { GlassCard } from 'src/shared/glass-card'
import { MoneyText } from 'src/shared/money-text'

export interface SummaryCardProps {
  label: string
  /** A number renders as money; a string renders verbatim. */
  value: number | string
  hint?: string
  emphasis?: boolean
}

/**
 * The design's dashboard `Card`: a compact label + figure tile.
 *
 * Sibling of `StatTile` but tuned for the dashboard's denser 4-across row, so
 * it uses a smaller type ramp and tighter padding. Kept separate rather than
 * adding a `dense` flag to `StatTile`, because the two appear on different
 * pages and will drift apart as the dashboard grows.
 */
export const SummaryCard = ({ label, value, hint, emphasis = false }: SummaryCardProps) => (
  <GlassCard
    flat
    sx={(theme) => ({
      p: 2,
      height: '100%',
      containerType: 'inline-size',
      ...(emphasis && { backgroundColor: theme.palette.primary.light, borderColor: theme.palette.primary.main }),
    })}
  >
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      {typeof value === 'number' ? (
        <MoneyText
          value={value}
          variant="h3"
          sx={{ display: 'block', whiteSpace: 'normal', overflowWrap: 'anywhere', fontSize: 'clamp(0.95rem, 5cqw, 1.25rem)' }}
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
  </GlassCard>
)
