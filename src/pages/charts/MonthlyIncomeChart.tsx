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
  const { number, digits } = useFormat()
  const { direction } = useTheme()

  const labels = monthNames(calendar, i18n)
  const peak = Math.max(1, ...months.map((month) => month.totalToman))

  // A time axis runs left-to-right in BOTH scripts — Farvardin on the left,
  // Esfand on the right. In RTL the first child lands rightmost, so the order
  // is reversed here rather than with `direction: ltr`, which the stylis RTL
  // plugin mirrors straight back.
  const plotted = direction === 'rtl' ? [...months].reverse() : months

  // «مرداد: ۵۸۹٫۲۵ م» — the design abbreviates to millions rather than printing
  // nine digits over a bar. The full figure lives in the ledger.
  const inMillions = (value: number) => t`${number(value / 1_000_000, 2)} M`

  // A bar's alternative text is NOT its tooltip. The tooltip is width-bound and
  // may abbreviate; a screen reader is not, so the label spells the month, the
  // year it belongs to, and the exact figure with its unit. Read from the
  // dashboard panel — whose title is «درآمد ماه‌به‌ماه», carrying neither year
  // nor unit — «۵۸۹٫۲۵ M» on its own says nothing at all. Every number goes
  // through `useFormat` so a Persian reader hears Persian numerals.
  const barLabel = (label: string, calendarYear: number, totalToman: number) => {
    const year = digits(calendarYear)
    // An empty month is the one thing the chart exists to expose (scenario 4's
    // Mordad), so it says so rather than announcing a bare zero.
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
        const height = month.totalToman > 0 ? Math.max(8, Math.round((month.totalToman / peak) * PLOT_HEIGHT)) : 4

        return (
          <Stack key={`${month.year}-${month.month}`} spacing={1} sx={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <Tooltip title={`${label}: ${inMillions(month.totalToman)}`} placement="top" arrow>
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
                // `role="img"` is what makes the label legal, not decoration:
                // `aria-label` is prohibited on a plain <div> (axe
                // `aria-prohibited-attr`, 120 findings — twelve bars across ten
                // stories), because a generic element has no role for a name to
                // attach to. A bar IS a graphic conveying one value, so the
                // month and its figure become that graphic's alternative text
                // and the hover-only tooltip stops being the only way to read
                // the chart.
                //
                // It also has to survive `Tooltip`: MUI copies a string `title`
                // onto the child as `aria-label`, and only loses to an explicit
                // one because `children.props` is spread last.
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
