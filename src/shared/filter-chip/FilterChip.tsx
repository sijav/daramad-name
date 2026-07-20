import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
    // `277:46` is a bare ✕; MUI defaults to a filled cancel disc.
    deleteIcon={<CloseRoundedIcon />}
    sx={[
      (theme) => ({
        // `277:45`: a tinted 32px chip at radius 16 with a hairline — not the
        // fully-rounded primary-container pill MUI defaults to.
        height: 32,
        borderRadius: `${radius.lg}px`,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: '20px',
        backgroundColor: theme.palette.brandPrimarySubtle,
        border: `1px solid ${theme.palette.borderDefault}`,
        color: theme.palette.text.primary,
        paddingInlineStart: '12px',
        paddingInlineEnd: '10px',
        '& .MuiChip-label': { padding: 0 },
        '& .MuiChip-deleteIcon': {
          margin: 0,
          marginInlineStart: '8px',
          fontSize: 16,
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.text.primary },
        },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)
