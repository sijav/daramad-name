import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> extends Omit<ToggleButtonGroupProps, 'value' | 'onChange' | 'exclusive'> {
  value: T
  options: readonly SegmentedOption<T>[]
  onValueChange: (value: T) => void
  /**
   * `filled` is the pill track with a solid primary segment (`49:16`).
   * `subtle` is the lighter one the report config uses (`357:770`): a
   * `surface-subtle` track with the selected segment raised in
   * `surface-default` and brand-coloured text.
   */
  variant?: 'filled' | 'subtle'
}

/**
 * The pill segmented control from the design — a filled primary pill sliding
 * over a recessed track.
 *
 * Built on `ToggleButtonGroup` with `exclusive` so keyboard navigation, roving
 * focus and the correct `aria` roles come from MUI rather than being
 * reimplemented on a row of divs.
 */
export const SegmentedControl = <T extends string>({
  value,
  options,
  onValueChange,
  variant = 'filled',
  sx,
  ...props
}: SegmentedControlProps<T>) => (
  <ToggleButtonGroup
    exclusive
    fullWidth
    value={value}
    // `next` is null when the user clicks the already-selected segment; ignore
    // it so the control can never end up with nothing selected.
    onChange={(_event, next: T | null) => next !== null && onValueChange(next)}
    sx={[
      (theme) => ({
        height: variant === 'subtle' ? 44 : 44,
        p: 0.5,
        gap: 0.5,
        borderRadius: `${variant === 'subtle' ? radius.sm + 2 : radius.full}px`,
        backgroundColor: variant === 'subtle' ? theme.palette.surfaceSubtle : theme.palette.surfaceContainerHigh,
        border: variant === 'subtle' ? 'none' : `1px solid ${theme.palette.outlineVariant}`,
        '& .MuiToggleButton-root': {
          border: 0,
          borderRadius: `${variant === 'subtle' ? radius.sm : radius.full}px !important`,
          color: theme.palette.text.secondary,
          ...theme.typography.subtitle2,
          '&.Mui-selected': {
            backgroundColor: variant === 'subtle' ? theme.palette.surfaceDefault : theme.palette.primary.main,
            color: variant === 'subtle' ? theme.palette.brandPrimary : theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: variant === 'subtle' ? theme.palette.surfaceDefault : theme.palette.primary.main,
            },
          },
        },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    {options.map((option) => (
      <ToggleButton key={option.value} value={option.value}>
        {option.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)
