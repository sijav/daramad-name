import { Paper, type PaperProps } from '@mui/material'
import { elevation, radius } from 'src/core/theme'

export interface GlassCardProps extends PaperProps {
  /** Removes the drop shadow for cards that sit inside another surface. */
  flat?: boolean
}

/**
 * The frosted surface every panel in the design sits on:
 * translucent white, 16px backdrop blur, 28px radius, soft drop shadow.
 *
 * Built on MUI's `Paper` rather than a bare `Box` so elevation, square/rounded
 * variants and the `component` prop keep working, and so the theme's
 * `MuiPaper` overrides apply in one place.
 */
export const GlassCard = ({ flat = false, sx, ...props }: GlassCardProps) => (
  <Paper
    elevation={0}
    sx={[
      {
        borderRadius: `${radius.xxl}px`,
        boxShadow: flat ? 'none' : elevation.card,
        p: { xs: 2.5, sm: 4 },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)
