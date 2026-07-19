import { useLingui } from '@lingui/react/macro'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'
import { useState } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  /**
   * When set, the user must type this exact word to enable the confirm button.
   * This is the second step of the two-step confirmation the brief requires
   * before wiping all data.
   */
  confirmationWord?: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Shared confirmation for destructive actions: deleting a receipt, restoring a
 * backup over existing data, and clearing everything.
 *
 * The body is a separate component so MUI unmounts it on close (Dialog does not
 * keep children mounted by default). That resets the typed confirmation word
 * for free — no effect watching `open`, and no way for a previous confirmation
 * to carry over and pre-arm the button.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  confirmationWord,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <ConfirmDialogBody
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      destructive={destructive}
      confirmationWord={confirmationWord}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  </Dialog>
)

const ConfirmDialogBody = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  confirmationWord,
  onConfirm,
  onClose,
}: Omit<ConfirmDialogProps, 'open'>) => {
  const { t } = useLingui()
  const [typed, setTyped] = useState('')
  const confirmDisabled = confirmationWord !== undefined && typed.trim() !== confirmationWord

  return (
    <>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText variant="body2">{description}</DialogContentText>

        {confirmationWord !== undefined ? (
          <TextField
            autoFocus
            fullWidth
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            label={t`برای تأیید، «${confirmationWord}» را بنویس`}
            sx={{ mt: 2.5 }}
          />
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          {cancelLabel ?? t`انصراف`}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={destructive ? 'error' : 'primary'} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </>
  )
}
