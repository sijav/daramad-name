import { Box, Paper, Stack, Typography, type PaperProps } from '@mui/material'
import type { ReactNode } from 'react'
import { elevation, radius } from 'src/core/theme'

export interface ChartCardProps extends Omit<PaperProps, 'title' | 'variant'> {
  title: string
  subtitle?: string
  /**
   * The design uses two radii on the same flat surface: 16 for `Chart/*`
   * panels and 20 (`--radius-xl`) for content cards.
   */
  variant?: 'chart' | 'content'
  /** Optional control aligned opposite the title, e.g. a link to a full page. */
  action?: ReactNode
  children: ReactNode
}

/**
 * The surface the design uses for charts: 16px radius, solid `surface-default`
 * and a 1px `border-default` hairline.
 *
 * Deliberately NOT `SurfaceCard`. The redesign moved chart panels off the heavy
 * 28px frosted treatment — a blurred translucent backdrop behind a data
 * visualisation costs contrast exactly where it matters most, and the flat
 * bordered card reads cleaner behind bars and arcs.
 */
export const ChartCard = ({ title, subtitle, variant = 'chart', action, children, sx, ...props }: ChartCardProps) => (
  <Paper
    elevation={0}
    sx={[
      (theme) => ({
        borderRadius: `${variant === 'content' ? radius.xl : radius.lg}px`,
        backgroundColor: theme.palette.surfaceDefault,
        border: `1px solid ${theme.palette.borderDefault}`,
        boxShadow: elevation.level1,
        p: 3,
        height: '100%',
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    <Stack spacing={2.5} sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Stack spacing={0.5} sx={{ minWidth: 0, textAlign: 'start' }}>
          <Typography variant="h5">{title}</Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      {children}
    </Stack>
  </Paper>
)
