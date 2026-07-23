import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  children: ReactNode
  labelId?: string
  helperText?: string
  error?: boolean
  fullWidth?: boolean
}

/**
 * The design's `Field`: a label ABOVE the control, not a MUI floating label
 * inside the outline, so labels stay readable at rest. Every input in the
 * design uses this, hence a wrapper rather than a per-field style override.
 */
export const Field = ({ label, children, labelId, helperText, error = false, fullWidth = true }: FieldProps) => (
  // The WRAPPER is the `<label>`, so the control is a descendant and the
  // association is implicit: no `htmlFor`/`id` plumbing, and it works for MUI
  // X's picker, which renders a section list rather than a plain input. As a
  // sibling `<Typography component="label">` it associated nothing and every
  // input in the app computed an empty accessible name.
  //
  // The inner label must stay a `span`: a label inside a label is invalid and
  // breaks the association this exists to create.
  <Box component="label" sx={{ display: 'block', width: fullWidth ? '100%' : 'auto', minWidth: 0 }}>
    <Typography id={labelId} variant="subtitle2" component="span" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
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
