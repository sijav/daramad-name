import { useLingui } from '@lingui/react/macro'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { radius } from 'src/core/theme'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { useFormat } from 'src/shared/format'
import type { CalendarSystem, MonthlyTotal } from 'src/shared/types'
import { monthNames } from 'src/shared/utils'

export interface MonthlyIncomeChartProps {
  months: MonthlyTotal[]
  calendar: CalendarSystem
}

const PLOT_HEIGHT = 220

/**
 * The 12-month bar chart (`153:604`).
 *
 * Deliberately not a charting library: the design has no axis, no gridlines and
 * no legend — twelve bars with their month beneath. MUI X drew all three and a
 * numeric scale nobody asked for, which is a different chart from the one in
 * the file. Plain boxes also mean the bars can carry the design's top-only 8px
 * corners, which the library does not expose.
 *
 * Every month is plotted, including the empty ones. A month with no income gets
 * the design's 4px grey stub rather than disappearing — dropping it would
 * compress the axis and quietly hide the gap, which is exactly the thing a
 * freelancer needs to see (scenario 4's Mordad).
 */
export const MonthlyIncomeChart = ({ months, calendar }: MonthlyIncomeChartProps) => {
  const { t, i18n } = useLingui()
  const { number } = useFormat()

  const labels = monthNames(calendar, i18n)
  const toman = i18n._(CURRENCY_LABELS.TOMAN)
  const peak = Math.max(1, ...months.map((month) => month.totalToman))

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end', justifyContent: 'center', pt: 4, width: '100%' }}>
      {months.map((month) => {
        const label = labels[month.month - 1]
        const height = month.totalToman > 0 ? Math.max(8, Math.round((month.totalToman / peak) * PLOT_HEIGHT)) : 4

        return (
          <Stack key={`${month.year}-${month.month}`} spacing={1} sx={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <Tooltip title={`${label}: ${number(month.totalToman)} ${toman}`} placement="top" arrow>
              <Box
                sx={(theme) => ({
                  width: '100%',
                  maxWidth: 44,
                  height,
                  // Top corners only, so the bars read as columns rising from a
                  // baseline rather than as floating pills.
                  borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
                  backgroundColor: month.totalToman > 0 ? theme.palette.brandPrimary : theme.palette.borderDefault,
                })}
                aria-label={t`${label}: ${number(month.totalToman)} ${toman}`}
              />
            </Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }} noWrap>
              {label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}
