import { Box, Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Every page has a designed empty state. Opening the tool for the first time
 * must not be a blank screen: it needs a sentence explaining why the page
 * matters and a button for the first action.
 */
export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <Stack spacing={2} sx={{ alignItems: 'center', py: { xs: 5, sm: 8 }, px: 3, textAlign: 'center' }}>
    {icon ? (
      <Box
        sx={(theme) => ({
          display: 'grid',
          placeItems: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
          '& svg': { fontSize: 34 },
        })}
      >
        {icon}
      </Box>
    ) : null}

    {/* An empty state stands in for the panel's content, so its title is a
        real heading at the same level a section title would be. */}
    <Typography variant="h3" component="h3">
      {title}
    </Typography>

    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
      {description}
    </Typography>

    {actionLabel && onAction ? (
      <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
        {actionLabel}
      </Button>
    ) : null}
  </Stack>
)
