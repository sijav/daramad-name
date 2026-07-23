import { Box, Paper, Stack, Typography, type PaperProps } from '@mui/material'
import type { ReactNode } from 'react'
import { elevation, radius } from 'src/core/theme'

export interface ChartCardProps extends Omit<PaperProps, 'title' | 'variant'> {
  title: string
  subtitle?: string
  variant?: 'chart' | 'content'
  action?: ReactNode
  children: ReactNode
}

/**
 * The surface the design uses for charts: 16px radius, solid `surface-default`
 * and a 1px `border-default` hairline.
 *
 * Deliberately NOT `SurfaceCard`. The redesign moved chart panels off the heavy
 * 28px frosted treatment, a blurred translucent backdrop behind a data
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
        boxShadow: variant === 'content' ? elevation.level1 : 'none',
        p: 3,
        height: '100%',
        // MUI X measures a chart against its parent. Inside a flex column the
        // box can resolve to zero width on first paint, which makes the chart
        // bail out with "container has no width" and never recover.
        minWidth: 0,
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    <Stack spacing={2.5} sx={{ height: '100%', minWidth: 0, width: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Stack spacing={0.5} sx={{ minWidth: 0, textAlign: 'start' }}>
          {/* The variant only picks the SIZE the design draws this panel's
              title at — 18px on a dashboard panel, 16px on a charts one. The
              element is pinned to `h3` in both, because either way this is a
              section title sitting under the page's `h2`. Without it the
              `chart` variant emitted an `<h5>` and skipped two levels. */}
          <Typography variant={variant === 'content' ? 'h3' : 'h5'} component="h3">
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ color: 'text.secondary' }} variant="caption">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      <Box sx={{ minWidth: 0, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>
    </Stack>
  </Paper>
)
