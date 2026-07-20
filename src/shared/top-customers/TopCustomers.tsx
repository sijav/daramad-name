import { useLingui } from '@lingui/react/macro'
import { Box, Stack, Typography } from '@mui/material'
import { useFormat } from 'src/shared/format'
import type { ClientShare } from 'src/shared/types'

export interface TopCustomersProps {
  shares: ClientShare[]
  /** How many to list; the rest fold into an "others" row. */
  limit?: number
  othersLabel: string
}

/**
 * The design's `Chart/Top Customers`: a ranked list, each row a name, a compact
 * amount, and a share bar.
 *
 * Amounts are shown in millions («۹۹۶ م تومان») because the full figure would
 * wrap at this width. The bar is measured against the LEADER rather than the
 * total — that is what the design's bar widths imply, and it keeps the gaps
 * between clients readable instead of squashing everything under a dominant
 * first row.
 */
export const TopCustomers = ({ shares, limit = 5, othersLabel }: TopCustomersProps) => {
  const { t } = useLingui()
  const { number } = useFormat()

  const top = shares.slice(0, limit)
  const rest = shares.slice(limit)
  const restTotal = rest.reduce((sum, share) => sum + share.totalToman, 0)

  const rows = restTotal > 0 ? [...top, { clientId: '__others__', clientName: othersLabel, totalToman: restTotal, percentage: 0 }] : top

  const leader = Math.max(1, ...rows.map((row) => row.totalToman))

  return (
    <Stack spacing={2}>
      {rows.map((row) => (
        <Stack key={row.clientId} spacing={1}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.clientName}
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {t`${number(Math.round(row.totalToman / 1_000_000))} M Toman`}
            </Typography>
          </Stack>

          <Box
            sx={(theme) => ({
              height: 8,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: theme.palette.surfaceSubtle,
            })}
          >
            <Box
              sx={(theme) => ({
                height: '100%',
                borderRadius: 999,
                // Minimum 2% so a tiny client still shows a sliver rather than
                // an empty track that reads as "no data".
                width: `${Math.max(2, (row.totalToman / leader) * 100)}%`,
                backgroundColor: theme.palette.brandPrimary,
              })}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  )
}
