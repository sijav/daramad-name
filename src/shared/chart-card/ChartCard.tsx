import { Paper, Stack, Typography, type PaperProps } from '@mui/material'
import type { ReactNode } from 'react'
import { radius } from 'src/core/theme'

export interface ChartCardProps extends Omit<PaperProps, 'title'> {
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * The surface the design uses for charts: 16px radius, solid `surface-default`
 * and a 1px `border-default` hairline.
 *
 * Deliberately NOT `GlassCard`. The redesign moved chart panels off the heavy
 * 28px frosted treatment — a blurred translucent backdrop behind a data
 * visualisation costs contrast exactly where it matters most, and the flat
 * bordered card reads cleaner behind bars and arcs.
 */
export const ChartCard = ({ title, subtitle, children, sx, ...props }: ChartCardProps) => (
  <Paper
    elevation={0}
    sx={[
      (theme) => ({
        borderRadius: `${radius.lg}px`,
        backgroundColor: theme.palette.surfaceDefault,
        border: `1px solid ${theme.palette.borderDefault}`,
        backdropFilter: 'none',
        p: 3,
        height: '100%',
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    <Stack spacing={2.5} sx={{ height: '100%' }}>
      <Stack spacing={0.5}>
        <Typography variant="h5">{title}</Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Stack>
  </Paper>
)
