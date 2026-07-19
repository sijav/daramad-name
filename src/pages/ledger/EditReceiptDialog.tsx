import { Dialog, DialogContent, DialogTitle } from '@mui/material'
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
 * Edit dialog. Mounted only while a receipt is selected — `useReceiptForm`
 * seeds its state once on mount, so a fresh mount per receipt is what keeps the
 * form in sync without an effect watching the prop.
 */
export const EditReceiptDialog = ({ receipt, onClose }: EditReceiptDialogProps) => {
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
      <DialogTitle>ویرایش دریافتی</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <ReceiptForm form={form} submitLabel="ذخیره تغییرات" pending={isPending} onSubmit={submit} />
      </DialogContent>
    </Dialog>
  )
}
