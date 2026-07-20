import { useLingui } from '@lingui/react/macro'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import { Box, Button, type ButtonProps } from '@mui/material'
import { radius } from 'src/core/theme'
import { useFormat } from 'src/shared/format'

export interface FilterButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children'> {
  /** How many filters are currently applied; drives the badge. */
  activeCount?: number
}

/**
 * Opens the filter popover, with a count badge when filters are applied.
 *
 * The badge matters for the same reason the chips do — a popover hides its
 * contents, so the trigger has to carry the state.
 *
 * The design (`275:63`) puts the funnel on one edge and a filled 20px count
 * badge on the other, INSIDE the control — not as a corner overlay. Funnel is
 * the `startIcon` and the badge the `endIcon` so RTL lands them on the right
 * and left respectively, matching the frame.
 */
export const FilterButton = ({ activeCount = 0, sx, ...props }: FilterButtonProps) => {
  const { t } = useLingui()
  const { digits } = useFormat()

  return (
    <Button
      variant="outlined"
      startIcon={<FilterAltOutlinedIcon />}
      endIcon={
        activeCount > 0 ? (
          <Box
            sx={(theme) => ({
              display: 'grid',
              placeItems: 'center',
              width: 20,
              height: 20,
              borderRadius: `${radius.sm + 2}px`,
              backgroundColor: theme.palette.brandPrimary,
              color: theme.palette.textOnPrimary,
              fontSize: 13,
              fontWeight: 500,
            })}
          >
            {digits(activeCount)}
          </Box>
        ) : null
      }
      sx={[
        (theme) => ({
          height: 44,
          paddingInline: '16px',
          gap: 0.5,
          borderRadius: `${radius.sm + 2}px`,
          backgroundColor: theme.palette.surfaceDefault,
          borderColor: theme.palette.borderDefault,
          color: theme.palette.text.primary,
          flexShrink: 0,
          '&:hover': { backgroundColor: theme.palette.surfaceSubtle, borderColor: theme.palette.borderDefault },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {t`Filters`}
    </Button>
  )
}
