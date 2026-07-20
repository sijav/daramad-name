import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  children: ReactNode
  /** Rendered under the control, in the error colour when `error` is set. */
  helperText?: string
  error?: boolean
  fullWidth?: boolean
}

/**
 * The design's `Field` component: a label sitting ABOVE the control, not a MUI
 * floating label inside the outline.
 *
 * This matters beyond aesthetics — the labels stay readable at rest, which is
 * what makes the 15-second entry path scannable. Every input in the design uses
 * this treatment, so it is a wrapper rather than a per-field style override.
 */
export const Field = ({ label, children, helperText, error = false, fullWidth = true }: FieldProps) => (
  <Box sx={{ width: fullWidth ? '100%' : 'auto', minWidth: 0 }}>
    <Typography variant="subtitle2" component="label" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
      {label}
    </Typography>

    {children}

    {helperText ? (
      <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.5 }}>
        {helperText}
      </Typography>
    ) : null}
  </Box>
)
