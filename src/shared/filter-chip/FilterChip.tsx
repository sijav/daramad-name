import { Chip, type ChipProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface FilterChipProps extends Omit<ChipProps, 'variant' | 'color'> {
  /** The filter's field name, shown before the value. */
  field: string
  /** The active value. */
  value: string
}

/**
 * One active filter, removable.
 *
 * Showing applied filters as dismissible chips is what makes a filter popover
 * safe: the popover hides the filter state, so without these the user cannot
 * tell why the ledger is showing 12 rows instead of 126.
 */
export const FilterChip = ({ field, value, sx, ...props }: FilterChipProps) => (
  <Chip
    label={`${field}: ${value}`}
    sx={[
      (theme) => ({
        ...theme.typography.caption,
        height: 32,
        borderRadius: `${radius.full}px`,
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.dark,
        '& .MuiChip-deleteIcon': { color: theme.palette.primary.main },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)
