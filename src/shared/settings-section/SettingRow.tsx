import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface SettingRowProps {
  label: string
  description?: string
  /** The control, shown opposite the label. Omitted for statement-only rows. */
  children?: ReactNode
}

/**
 * One row of a settings section: label and description on the reading side,
 * the control opposite. Matches the design's `360:829` — 16px inline padding,
 * 14px block, label 14/600, description 12/400.
 */
export const SettingRow = ({ label, description, children }: SettingRowProps) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', px: 2, py: 1.75 }}
  >
    <Stack spacing={0.25} sx={{ minWidth: 0, textAlign: 'start' }}>
      <Typography variant="subtitle2">{label}</Typography>
      {description ? (
        <Typography sx={{ color: 'text.secondary' }} variant="caption">
          {description}
        </Typography>
      ) : null}
    </Stack>
    {children ? (
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
        {children}
      </Stack>
    ) : null}
  </Stack>
)
