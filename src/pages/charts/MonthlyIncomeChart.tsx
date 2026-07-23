import { useLingui } from '@lingui/react/macro'
import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import { radius } from 'src/core/theme'
import { useFormat } from 'src/shared/format'
import type { CalendarSystem, MonthlyTotal } from 'src/shared/types'
import { monthNames } from 'src/shared/utils'

export interface MonthlyIncomeChartProps {
  months: MonthlyTotal[]
  calendar: CalendarSystem
}

const PLOT_HEIGHT = 220
/** The design's stub for a month with no income, so the gap is visible rather than absent. */
const EMPTY_BAR_HEIGHT = 4
/** Keeps a very small month from rendering as a sliver indistinguishable from the stub. */
const MIN_BAR_HEIGHT = 8

/**
 * The 12-month bar chart (Figma `153:604`).
 *
 * Not a charting library: the design has no axis, no gridlines and no legend,
 * and MUI X draws all three plus a numeric scale. Plain boxes also take the
 * design's top-only corners, which the library does not expose.
 *
 * Every month is plotted, empty ones included. Dropping them would compress the
 * axis and hide the gap the chart exists to show.
 */
export const MonthlyIncomeChart = ({ months, calendar }: MonthlyIncomeChartProps) => {
  const { t, i18n } = useLingui()
  const { number, digits } = useFormat()
  const theme = useTheme()

  const labels = monthNames(calendar, i18n)
  const peak = Math.max(1, ...months.map((month) => month.totalToman))

  // A time axis runs left-to-right in BOTH scripts, Farvardin on the left,
  // Esfand on the right. In RTL the first child lands rightmost, so the order
  // is reversed here rather than with `direction: ltr`, which the stylis RTL
  // plugin mirrors straight back.
  const plotted = theme.direction === 'rtl' ? [...months].reverse() : months

  // «مرداد: ۵۸۹٫۲۵ م», the design abbreviates to millions rather than printing
  // nine digits over a bar. The full figure lives in the ledger.
  const inMillions = (value: number) => t`${number(value / 1_000_000, 2)} M`

  // A bar's alternative text is NOT its tooltip. The tooltip abbreviates to fit
  // a width; a screen reader has none, and the panel title it is read under
  // («درآمد ماه‌به‌ماه») carries neither year nor unit, so the label spells out
  // all three.
  const barLabel = (label: string, calendarYear: number, totalToman: number) => {
    const year = digits(calendarYear)
    if (totalToman <= 0) {
      return t`${label} ${year}: no income recorded`
    }
    const amount = number(totalToman)
    return t`${label} ${year}: ${amount} Toman`
  }

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'flex-end',
        justifyContent: 'center',
        pt: 4,
        width: '100%',
      }}
    >
      {plotted.map((month) => {
        const label = labels[month.month - 1]
        const height =
          month.totalToman > 0 ? Math.max(MIN_BAR_HEIGHT, Math.round((month.totalToman / peak) * PLOT_HEIGHT)) : EMPTY_BAR_HEIGHT

        return (
          <Stack key={`${month.year}-${month.month}`} spacing={1} sx={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <Tooltip title={`${label}: ${inMillions(month.totalToman)}`} placement="top" arrow>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 44,
                  height,
                  // Top corners only, so the bars read as columns rising from a
                  // baseline rather than as floating pills.
                  borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
                  backgroundColor: month.totalToman > 0 ? theme.palette.brandPrimary : theme.palette.borderDefault,
                }}
                // `aria-label` is prohibited on a plain <div> (axe
                // `aria-prohibited-attr`, 120 findings), because a generic
                // element has no role for a name to attach to. A bar is a
                // graphic conveying one value, so `role="img"` is what makes
                // the label legal and the hover-only tooltip stops being the
                // only way to read the chart.
                //
                // The explicit `aria-label` also has to beat the one `Tooltip`
                // copies from a string `title`, which it does because
                // `children.props` is spread last.
                role="img"
                aria-label={barLabel(label, month.year, month.totalToman)}
              />
            </Tooltip>
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }} noWrap>
              {label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}
