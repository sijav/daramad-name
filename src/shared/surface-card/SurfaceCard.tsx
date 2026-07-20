import { Paper, type PaperProps } from '@mui/material'
import { elevation, radius } from 'src/core/theme'

export interface SurfaceCardProps extends Omit<PaperProps, 'variant'> {
  /**
   * `xl` (20px) for a screen's primary panel, `lg` (16px) for supporting ones.
   * The design draws this distinction on every screen — the Quick Entry form is
   * 20 while the three panels beside it are 16.
   */
  radius?: 'lg' | 'xl'
  /**
   * `subtle` is the `brand-primary-subtle` tint the design uses for callouts and
   * the dashboard's report shortcut.
   */
  tone?: 'default' | 'subtle'
  /** Drops the Elevation/1 shadow. The design omits it on Ledger, Report and Settings. */
  flat?: boolean
  /**
   * Removes the padding for cards whose child paints edge to edge — the ledger
   * table, whose header band has to reach the rounded corners.
   *
   * A prop rather than `sx={{ p: 0 }}`: the default padding is responsive, so a
   * scalar override loses to its own `@media` rule and the padding stays.
   */
  disablePadding?: boolean
}

/**
 * The panel every page sits on: a 1px `border-default` hairline over
 * `surface-default`, with the radius and shadow the screen calls for.
 *
 * This was `GlassCard` — translucent with a 16px backdrop blur and 28px
 * corners. That treatment came from one record card in an older revision of
 * the design; the current system uses flat bordered surfaces everywhere, and
 * the blur was being inherited by every menu and dialog in the app.
 *
 * Built on MUI's `Paper` rather than a bare `Box` so elevation, square/rounded
 * variants and the `component` prop keep working, and so the theme's
 * `MuiPaper` overrides apply in one place.
 */
export const SurfaceCard = ({
  radius: size = 'xl',
  tone = 'default',
  flat = false,
  disablePadding = false,
  sx,
  ...props
}: SurfaceCardProps) => (
  <Paper
    elevation={0}
    sx={[
      (theme) => ({
        borderRadius: `${size === 'xl' ? radius.xl : radius.lg}px`,
        backgroundColor: tone === 'subtle' ? theme.palette.brandPrimarySubtle : theme.palette.surfaceDefault,
        boxShadow: flat ? 'none' : elevation.level1,
        ...(disablePadding ? { p: 0, overflow: 'hidden' } : { p: { xs: 2.5, sm: 3 } }),
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
)
