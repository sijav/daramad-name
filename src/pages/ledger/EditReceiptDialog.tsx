import { Trans, useLingui } from '@lingui/react/macro'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { invalidateReceiptQueries } from 'src/core/query'
import { updateReceiptMutation } from 'src/shared/queries'
import { ReceiptForm, useReceiptForm } from 'src/shared/receipt-form'
import type { ReceiptWithClient } from 'src/shared/types'

export interface EditReceiptDialogProps {
  receipt: ReceiptWithClient
  onClose: () => void
}

/**
 * Edit dialog. Mounted only while a receipt is selected, `useReceiptForm`
 * seeds its state once on mount, so a fresh mount per receipt is what keeps the
 * form in sync without an effect watching the prop.
 */
export const EditReceiptDialog = ({ receipt, onClose }: EditReceiptDialogProps) => {
  const { t } = useLingui()
  const form = useReceiptForm(receipt)

  const { mutate, isPending } = useMutation({
    mutationFn: updateReceiptMutation,
    onSuccess: async () => {
      await invalidateReceiptQueries()
      onClose()
    },
  })

  const submit = () => {
    form.markSubmitted()
    if (!form.isValid) {
      return
    }
    mutate({
      id: receipt.id,
      occurredAt: form.state.occurredAt,
      amountOriginal: form.state.amountOriginal ?? 0,
      currency: form.state.currency,
      rate: form.state.rate,
      clientName: form.state.clientName,
      channel: form.state.channel,
      note: form.state.note,
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      {/* A visible way out. The dialog previously closed only on Escape or a
          backdrop click — neither of which exists on a phone, where this opens
          nearly full-screen and the only apparent options are save or nothing. */}
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Trans>Edit receipt</Trans>
          <IconButton onClick={onClose} aria-label={t`Close`} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <ReceiptForm form={form} submitLabel={t`Save changes`} pending={isPending} onSubmit={submit} />
      </DialogContent>
    </Dialog>
  )
}
