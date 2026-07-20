import { Paper, type PaperProps } from '@mui/material'
import { elevation, radius } from 'src/core/theme'

export interface SurfaceCardProps extends PaperProps {
  /** Removes the drop shadow for cards that sit inside another surface. */
  flat?: boolean
}

/**
 * The panel every page sits on: `surface-default` fill, a 1px `border-default`
 * hairline, 20px (`--radius-xl`) corners and the Elevation/1 shadow.
 *
 * This was `SurfaceCard` — translucent with a 16px backdrop blur and 28px
 * corners. That treatment came from one record card in an older revision of
 * the design; the current system uses flat bordered surfaces everywhere, and
 * the blur was being inherited by every menu and dialog in the app.
 *
 * Built on MUI's `Paper` rather than a bare `Box` so elevation, square/rounded
 * variants and the `component` prop keep working, and so the theme's
 * `MuiPaper` overrides apply in one place.
 */
export const SurfaceCard = ({ flat = false, sx, ...props }: SurfaceCardProps) => (
  <Paper
    elevation={0}
    sx={[
      {
        borderRadius: `${radius.xl}px`,
        boxShadow: flat ? 'none' : elevation.level1,
        p: { xs: 2.5, sm: 4 },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)
