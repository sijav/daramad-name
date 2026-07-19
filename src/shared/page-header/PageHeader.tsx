import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 3 }}
  >
    <Box>
      <Typography variant="h2" component="h2">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
    {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
  </Stack>
)
