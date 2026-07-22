import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  children: ReactNode
  /**
   * Put on the label text itself, so a control that a `<label>` cannot name can
   * point at it with `aria-labelledby`.
   *
   * Only ARIA-labelable elements benefit from the implicit association the
   * wrapper gives: MUI X's picker renders `role="group"` around its editable
   * sections, and a group is not a labelable element, so the picker asks for an
   * id and spells the association out.
   */
  labelId?: string
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
export const Field = ({ label, children, labelId, helperText, error = false, fullWidth = true }: FieldProps) => (
  // The WRAPPER is the `<label>`, so the control is a descendant and the
  // association is implicit — no `htmlFor`/`id` plumbing, and it works for MUI
  // X's picker, which renders a section list rather than a plain input.
  //
  // It used to be a sibling `<Typography component="label">` with no `htmlFor`,
  // which associated nothing: every input in the app computed an EMPTY
  // accessible name. A screen-reader user filling the receipt form heard four
  // unlabelled text boxes and could not tell which one was the exchange rate —
  // on the one form where the wrong number freezes a permanently wrong Toman
  // value. The inner label is now a span, because a label inside a label is
  // invalid and would break the association it is meant to create.
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
