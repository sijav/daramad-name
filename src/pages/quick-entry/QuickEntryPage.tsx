import { Trans, useLingui } from '@lingui/react/macro'
import { Alert, Box, Grid, Snackbar, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { invalidateReceiptQueries } from 'src/core/query'
import { PageHeader } from 'src/shared/page-header'
import { createReceiptMutation, type CreateReceiptRequest } from 'src/shared/queries'
import { ReceiptForm, useReceiptForm } from 'src/shared/receipt-form'
import { SurfaceCard } from 'src/shared/surface-card'
import { QuickEntryAside } from './QuickEntryAside'

/**
 * Scenario 1: record a receipt in under 15 seconds.
 *
 * Smart defaults do the work — today's date, the last channel, an autofocused
 * amount field — so the fast path is type amount, tab, save.
 */
export const QuickEntryPage = () => {
  const { t } = useLingui()
  const form = useReceiptForm()
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: createReceiptMutation,
    onSuccess: async () => {
      await invalidateReceiptQueries()
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const submit = (keepClient: boolean) => {
    form.markSubmitted()
    if (!form.isValid) {
      return
    }

    const request: CreateReceiptRequest = {
      occurredAt: form.state.occurredAt,
      // Validated above; the non-null assertions are safe here.
      amountOriginal: form.state.amountOriginal ?? 0,
      currency: form.state.currency,
      rate: form.state.rate,
      clientName: form.state.clientName,
      channel: form.state.channel,
      note: form.state.note,
    }

    mutate(request, {
      onSuccess: () => {
        setToast(t`Receipt saved.`)
        if (keepClient) {
          form.resetKeepingClient()
        } else {
          form.reset()
        }
      },
    })
  }

  return (
    <Box>
      <PageHeader
        title={t`Record a receipt quickly`}
        subtitle={t`Log a new receipt in under 15 seconds.`}
        meta={t`The conversion rate is stored as you record it and does not change later.`}
      />

      {/* The design's two-column grid: the form leads, with the support column
          beside it. Form first in the DOM so RTL keeps it on the reading side. */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SurfaceCard>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3">
                <Trans>Receipt details</Trans>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                <Trans>Enter the amount, the client and how you were paid.</Trans>
              </Typography>
            </Box>

            <ReceiptForm
              form={form}
              submitLabel={t`Record a receipt`}
              pending={isPending}
              onSubmit={() => submit(false)}
              onSubmitAndNext={() => submit(true)}
            />
          </SurfaceCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <QuickEntryAside />
        </Grid>
      </Grid>

      <Snackbar open={toast !== null} autoHideDuration={2500} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>

      <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
