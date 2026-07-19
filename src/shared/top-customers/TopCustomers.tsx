import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { useFormat } from 'src/shared/format'
import { MoneyText } from 'src/shared/money-text'
import type { ClientShare } from 'src/shared/types'

export interface TopCustomersProps {
  shares: ClientShare[]
  /** How many to list; the rest are folded into an "others" row. */
  limit?: number
  othersLabel: string
}

/**
 * The design's `Chart/Top Customers`: a ranked list with a share bar.
 *
 * Complements the donut rather than repeating it — a donut is poor at ordering
 * and unreadable below about 5%, while this stays legible down to a rounding
 * error and gives the exact figure beside each name.
 */
export const TopCustomers = ({ shares, limit = 5, othersLabel }: TopCustomersProps) => {
  const { number } = useFormat()

  const top = shares.slice(0, limit)
  const rest = shares.slice(limit)
  const restTotal = rest.reduce((sum, share) => sum + share.totalToman, 0)
  const restPercentage = rest.reduce((sum, share) => sum + share.percentage, 0)

  const rows =
    restTotal > 0 ? [...top, { clientId: '__others__', clientName: othersLabel, totalToman: restTotal, percentage: restPercentage }] : top

  return (
    <Stack spacing={2}>
      {rows.map((row) => (
        <Box key={row.clientId}>
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75, gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.clientName}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {number(row.percentage, 1)}%
              </Typography>
              <MoneyText value={row.totalToman} variant="subtitle2" showUnit={false} />
            </Stack>
          </Stack>

          <LinearProgress
            variant="determinate"
            // Clamped because rounded percentages can total slightly over 100.
            value={Math.min(100, row.percentage)}
            sx={(theme) => ({
              height: 8,
              borderRadius: 999,
              backgroundColor: theme.palette.surfaceContainerHigh,
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            })}
          />
        </Box>
      ))}
    </Stack>
  )
}
