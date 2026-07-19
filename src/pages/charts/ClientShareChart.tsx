import { useTheme } from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import type { ClientShare } from 'src/shared/types'
import { formatNumberPersian, toPersianDigits } from 'src/shared/utils'

export interface ClientShareChartProps {
  shares: ClientShare[]
}

/**
 * Client-share donut. Colours walk a single-hue ramp from the brand blue rather
 * than using a rainbow, so the largest slice reads as "most saturated" and the
 * chart stays legible for colour-blind viewers.
 */
export const ClientShareChart = ({ shares }: ClientShareChartProps) => {
  const theme = useTheme()

  const palette = [theme.palette.primary.main, '#6b93f7', '#8facf9', '#b0c6fb', '#c9d8fc', theme.palette.outline]

  return (
    <PieChart
      height={320}
      series={[
        {
          innerRadius: 60,
          paddingAngle: 2,
          cornerRadius: 6,
          data: shares.map((share, index) => ({
            id: share.clientId,
            value: share.totalToman,
            label: share.clientName,
            color: palette[index % palette.length],
          })),
          valueFormatter: (item) => `${formatNumberPersian(item.value)} تومان`,
          arcLabel: (item) => `${toPersianDigits(String(Math.round((item.value / total(shares)) * 100)))}٪`,
          arcLabelMinAngle: 25,
        },
      ]}
    />
  )
}

const total = (shares: ClientShare[]): number => shares.reduce((sum, share) => sum + share.totalToman, 0) || 1
