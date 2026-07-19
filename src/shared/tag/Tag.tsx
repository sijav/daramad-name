import { Chip, type ChipProps, type Theme } from '@mui/material'
import { radius } from 'src/core/theme'

export type TagTone = 'neutral' | 'primary' | 'success' | 'warning'

export interface TagProps extends Omit<ChipProps, 'color' | 'variant'> {
  tone?: TagTone
}

/**
 * The design's `Tag`: a small, low-contrast pill used for a receipt's channel
 * and for status markers such as «فریزشده».
 *
 * Distinct from `ChipSelect`'s chips, which are interactive choices. A Tag is
 * read-only, so it renders without a click target or focus ring.
 */
export const Tag = ({ tone = 'neutral', sx, ...props }: TagProps) => (
  <Chip
    size="small"
    sx={[
      (theme: Theme) => ({
        ...theme.typography.caption,
        height: 26,
        borderRadius: `${radius.full}px`,
        ...toneStyles(tone, theme),
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)

const toneStyles = (tone: TagTone, theme: Theme) => {
  switch (tone) {
    case 'primary':
      return { backgroundColor: theme.palette.primary.light, color: theme.palette.primary.dark }
    case 'success':
      return { backgroundColor: theme.palette.success.light, color: theme.palette.success.main }
    case 'warning':
      // No warning container in the Figma palette; this pairs with the amber
      // used by the backdating alert.
      return { backgroundColor: '#fdf0d5', color: '#7a5200' }
    case 'neutral':
    default:
      return {
        backgroundColor: theme.palette.surfaceContainerHigh,
        color: theme.palette.text.secondary,
        border: `1px solid ${theme.palette.outlineVariant}`,
      }
  }
}
