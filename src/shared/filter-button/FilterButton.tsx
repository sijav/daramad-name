import { useLingui } from '@lingui/react/macro'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import { Box, Button, type ButtonProps } from '@mui/material'
import { radius } from 'src/core/theme'
import { useFormat } from 'src/shared/format'

export interface FilterButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children'> {
  activeCount?: number
}

/**
 * Opens the filter popover, with a count badge when filters are applied.
 *
 * A popover hides its contents, so the trigger has to carry the state; that is
 * what the badge and the chips are both for.
 *
 * Figma `275:63` puts the funnel on one edge and a filled 20px count badge on
 * the other, INSIDE the control rather than as a corner overlay. The funnel is
 * the `startIcon` and the badge the last child, so RTL lands them right and
 * left to match the frame. Why the badge is not the `endIcon` is recorded at
 * the badge itself.
 */
export const FilterButton = ({ activeCount = 0, sx, ...props }: FilterButtonProps) => {
  const { t } = useLingui()
  const { digits } = useFormat()

  return (
    <Button
      variant="outlined"
      startIcon={<FilterAltOutlinedIcon />}
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

      {/* The count sits in the button's CHILDREN, not in `endIcon`. MUI styles
          that slot with `.MuiButton-endIcon > *:nth-of-type(1) { font-size }`,
          which outranks the badge's own class and blew the digit up to 20px
          inside a 20px circle. */}
      {activeCount > 0 ? (
        <Box
          component="span"
          sx={(theme) => ({
            display: 'grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            flexShrink: 0,
            marginInlineStart: '12px',
            borderRadius: '50%',
            backgroundColor: theme.palette.brandPrimary,
            color: theme.palette.textOnPrimary,
            // `275:65`: 13/500 on a 20px line box, so the glyph centres.
            fontSize: 13,
            fontWeight: 500,
            lineHeight: '20px',
          })}
        >
          {digits(activeCount)}
        </Box>
      ) : null}
    </Button>
  )
}
