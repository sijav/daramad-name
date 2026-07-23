import { Button, type ButtonProps } from '@mui/material'
import { radius } from 'src/core/theme'

export interface SettingButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  /**
   * `neutral` is the design's default settings control, `surface-subtle` with
   * a hairline. `primary` and `danger` are the filled treatments.
   */
  tone?: 'neutral' | 'primary' | 'danger'
}

/**
 * The pill control in a settings row (`360:830`): 40px tall, fully rounded,
 * 13/500, smaller and lighter than a page-level `Button`, which is 48/14/600.
 */
export const SettingButton = ({ tone = 'neutral', sx, ...props }: SettingButtonProps) => (
  <Button
    {...props}
    variant={tone === 'neutral' ? 'outlined' : 'contained'}
    color={tone === 'danger' ? 'error' : 'primary'}
    sx={[
      (theme) => ({
        height: 40,
        paddingInline: '20px',
        borderRadius: `${radius.full}px`,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        ...(tone === 'neutral' && {
          backgroundColor: theme.palette.surfaceSubtle,
          borderColor: theme.palette.borderDefault,
          color: theme.palette.text.primary,
          '&:hover': { backgroundColor: theme.palette.surfaceContainerHigh, borderColor: theme.palette.borderDefault },
        }),
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
)
