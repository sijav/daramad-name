import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { SurfaceCard } from 'src/shared/surface-card'

export interface SettingsSectionProps {
  title: string
  children: ReactNode
}

/**
 * The design's settings `Section` (`360:826`): a flat 16px card padded to 8,
 * with a 16/600 heading row and hairline-separated rows beneath.
 *
 * The 8px padding is deliberate — the row separators run the full width of the
 * card interior, which they cannot do if the card itself pads to 24.
 */
export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <SurfaceCard radius="lg" flat sx={{ p: 1, overflow: 'hidden' }}>
    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
      <Typography variant="h5">{title}</Typography>
    </Box>
    <Stack
      sx={{
        // Every row but the last carries the design's bottom hairline.
        '& > :not(:last-of-type)': (theme) => ({ borderBottom: `1px solid ${theme.palette.borderDefault}` }),
      }}
    >
      {children}
    </Stack>
  </SurfaceCard>
)
