import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  meta?: string
  action?: ReactNode
}

/**
 * The page title block. Every screen in the design pairs it with the same
 * leading cluster, a report-range pill and the primary "record a receipt"
 * button, which pages pass in as `action`.
 */
export const PageHeader = ({ title, subtitle, meta, action }: PageHeaderProps) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 3 }}
  >
    <Box sx={{ textAlign: 'start' }}>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
      {meta ? (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          {meta}
        </Typography>
      ) : null}
    </Box>
    {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
  </Stack>
)
