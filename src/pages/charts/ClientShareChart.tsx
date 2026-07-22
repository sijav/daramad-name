import { useLingui } from '@lingui/react/macro'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import { useFormat } from 'src/shared/format'
import type { ClientShare } from 'src/shared/types'

export interface ClientShareChartProps {
  shares: ClientShare[]
  /** Rows past this fold into a single "others" slice. */
  limit?: number
  othersLabel: string
}

const DONUT_SIZE = 160

/**
 * The design's `Chart/Donut`: a legend on one side, a 150px donut on the other,
 * with the leading client's share called out in the hole.
 *
 * Colours are categorical (blue / green / amber / grey) from the design's
 * `chartSeries`. An earlier single-hue ramp read well in isolation, but the
 * design specifies distinct hues — which also holds up when the legend is read
 * apart from the arc.
 */
export const ClientShareChart = ({ shares, limit = 4, othersLabel }: ClientShareChartProps) => {
  const { t } = useLingui()
  const theme = useTheme()
  const { number, digits } = useFormat()

  const rows = foldOthers(shares, limit, othersLabel)
  const total = rows.reduce((sum, row) => sum + row.totalToman, 0) || 1
  const leader = rows[0]
  const pct = (value: number) => Math.round((value / total) * 100)

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: DONUT_SIZE, height: DONUT_SIZE, flexShrink: 0 }}>
        <PieChart
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          hideLegend
          series={[
            {
              innerRadius: DONUT_SIZE / 2 - 22,
              outerRadius: DONUT_SIZE / 2,
              paddingAngle: 1,
              cornerRadius: 2,
              data: rows.map((row, index) => ({
                id: row.clientId,
                value: row.totalToman,
                label: row.clientName,
                color: theme.palette.chartSeries[index % theme.palette.chartSeries.length],
              })),
              // This formatter is the donut's ONLY text alternative. MUI X marks
              // its own `<svg>` `aria-hidden`, so nothing in the drawing reaches
              // a screen reader except through here: it feeds the hover tooltip
              // AND the keyboard-navigation announcement, which `pieDescription`
              // builds as «label; formattedValue». A bare «۲۳۵٬۸۳۰٬۰۰۰» leaves a
              // figure with no unit and no proportion — and the proportion is
              // the only thing a slice is drawn to say.
              valueFormatter: (item) => {
                const amount = number(item.value)
                const share = digits(pct(item.value))
                return t`${amount} Toman (${share}%)`
              },
            },
          ]}
        />

        {/* Overlaid rather than drawn as a chart label: an arc label would be
            positioned and rotated by the slice, not centred in the hole. */}
        {leader ? (
          <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Typography variant="h1" sx={{ lineHeight: 1 }}>
              {t`${digits(pct(leader.totalToman))}%`}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }} variant="caption">
              {leader.clientName}
            </Typography>
          </Stack>
        ) : null}
      </Box>
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        {rows.map((row, index) => (
          <Stack key={row.clientId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: theme.palette.chartSeries[index % theme.palette.chartSeries.length],
              }}
            />
            {/* `153:653`/`153:654`: the SHARE is the emphasised half at 14/600
                on `text-primary`, the client name trails at 14/400 secondary. */}
            <Typography sx={{ color: 'text.secondary' }} variant="body2">
              {row.clientName}
            </Typography>
            <Typography variant="subtitle2">{t`${digits(pct(row.totalToman))}%`}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

/** Keeps the legend to `limit` rows; the tail becomes one "others" slice. */
const foldOthers = (shares: ClientShare[], limit: number, othersLabel: string): ClientShare[] => {
  if (shares.length <= limit) {
    return shares
  }
  const head = shares.slice(0, limit - 1)
  const tail = shares.slice(limit - 1)
  return [
    ...head,
    {
      clientId: '__others__',
      clientName: othersLabel,
      totalToman: tail.reduce((sum, share) => sum + share.totalToman, 0),
      percentage: tail.reduce((sum, share) => sum + share.percentage, 0),
    },
  ]
}
