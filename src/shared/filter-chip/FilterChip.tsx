import { useLingui } from '@lingui/react/macro'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Chip, type ChipProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface FilterChipProps extends Omit<ChipProps, 'variant' | 'color'> {
  field: string
  value: string
}

/**
 * One active filter, removable.
 *
 * Showing applied filters as dismissible chips is what makes a filter popover
 * safe: the popover hides the filter state, so without these the user cannot
 * tell why the ledger is showing 12 rows instead of 126.
 */
export const FilterChip = ({ field, value, sx, ...props }: FilterChipProps) => {
  const { t } = useLingui()

  return (
    <Chip
      label={`${field}: ${value}`}
      // `277:46` is a bare ✕; MUI defaults to a filled cancel disc.
      //
      // MUI clones the delete icon with only `className` and `onClick`, so the
      // role and the name set here survive the clone. `aria-hidden` has to be
      // cancelled explicitly: `SvgIcon` writes `aria-hidden="true"` on every
      // icon, which otherwise leaves the only control for removing an active
      // filter unnamed to a screen reader.
      deleteIcon={<CloseRoundedIcon aria-hidden={false} role="button" aria-label={t`Remove the ${field} filter`} />}
      sx={[
        (theme) => ({
          // `277:45`: a tinted 32px chip at radius 16 with a hairline, not the
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
}
