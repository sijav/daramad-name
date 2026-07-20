import { Trans, useLingui } from '@lingui/react/macro'
import { Alert, Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { radius } from 'src/core/theme'
import { AmountField } from 'src/shared/amount-field'
import { ChipSelect } from 'src/shared/chip-select'
import { CHANNEL_LABELS, CURRENCY_LABELS } from 'src/shared/constants'
import { DateField } from 'src/shared/date-field'
import { Field } from 'src/shared/field'
import { MoneyText } from 'src/shared/money-text'
import { NumberField } from 'src/shared/number-field'
import { clientsQueryKey, getClientsQuery } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { CHANNELS, CURRENCIES, type Channel, type Currency } from 'src/shared/types'
import type { useReceiptForm } from './useReceiptForm'

export interface ReceiptFormProps {
  form: ReturnType<typeof useReceiptForm>
  submitLabel: string
  pending?: boolean
  onSubmit: () => void
  /** «ذخیره و بعدی» — omitted when editing an existing receipt. */
  onSubmitAndNext?: () => void
}

/**
 * The receipt form. Every field is presentational; all state lives in
 * `useReceiptForm`, so the same component serves both the quick-entry page and
 * the edit dialog.
 *
 * Labels sit above their controls via `Field`, matching the design — MUI's
 * floating labels would collapse into the outline and cost scannability on the
 * one screen that has to be fast.
 */
export const ReceiptForm = ({ form, submitLabel, pending = false, onSubmit, onSubmitAndNext }: ReceiptFormProps) => {
  const { t, i18n } = useLingui()
  const { state, patch, errors, showErrors, needsRate, isBackdated, tomanPreview } = form
  const { data: clients = [] } = useQuery({ queryKey: clientsQueryKey, queryFn: getClientsQuery })

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {/* `175:769` opens with the date, then the amount. */}
      <DateField label={t`Date received`} value={state.occurredAt} onValueChange={(iso) => patch('occurredAt', iso)} />

      <AmountField
        label={t`Amount received`}
        value={state.amountOriginal}
        currency={state.currency}
        onValueChange={(value) => patch('amountOriginal', value)}
        error={showErrors && Boolean(errors.amountOriginal)}
        helperText={showErrors ? errors.amountOriginal : undefined}
        autoFocus
      />

      <SegmentedControl<Currency>
        value={state.currency}
        options={CURRENCIES.map((currency) => ({ value: currency, label: i18n._(CURRENCY_LABELS[currency]) }))}
        onValueChange={(currency) => {
          patch('currency', currency)
          // Clearing the rate when returning to toman stops a stale rate from
          // being silently reused if the user switches currency again.
          if (currency === 'TOMAN') {
            patch('rate', null)
          }
        }}
      />

      {needsRate ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Field
              label={isBackdated ? t`Exchange rate on that date (Toman)` : t`Today's exchange rate (Toman)`}
              error={showErrors && Boolean(errors.rate)}
              helperText={showErrors ? errors.rate : undefined}
            >
              <NumberField
                value={state.rate}
                onValueChange={(value) => patch('rate', value)}
                error={showErrors && Boolean(errors.rate)}
                fullWidth
              />
            </Field>

            {/* `175:802`: a tinted readout, not a field — the figure on the
                reading edge and "frozen" opposite it, both in brand blue, so it
                reads as a result rather than something else to fill in. */}
            <Field label={t`Toman equivalent (stored at the moment of entry)`}>
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 2,
                  borderRadius: `${radius.md}px`,
                  backgroundColor: theme.palette.brandPrimarySubtle,
                  color: theme.palette.brandPrimary,
                })}
              >
                <MoneyText value={tomanPreview} sx={{ fontWeight: 600, lineHeight: '24px' }} />
                <Typography variant="caption">{t`Frozen`}</Typography>
              </Box>
            </Field>
          </Stack>

          {isBackdated ? (
            <Alert severity="info" sx={{ borderRadius: `${radius.md}px` }}>
              <Trans>
                This receipt is backdated. Enter the rate from that day, not today's — the amount is frozen permanently and will not change
                if the price moves later.
              </Trans>
            </Alert>
          ) : null}
        </Stack>
      ) : null}

      <Field label={t`Client / project`}>
        <Autocomplete
          freeSolo
          options={clients.map((client) => client.name)}
          value={state.clientName}
          onChange={(_event, value) => patch('clientName', value ?? '')}
          onInputChange={(_event, value) => patch('clientName', value)}
          renderInput={(params) => <TextField {...params} placeholder={t`Type or pick a client name`} />}
        />
      </Field>

      <ChipSelect<Channel>
        label={t`Payment channel`}
        value={state.channel}
        options={CHANNELS.map((channel) => ({ value: channel, label: i18n._(CHANNEL_LABELS[channel]) }))}
        onValueChange={(channel) => patch('channel', channel)}
      />

      <Field label={t`Note (optional)`}>
        <TextField
          value={state.note}
          onChange={(event) => patch('note', event.target.value)}
          placeholder={t`e.g. deposit for design phase one`}
          fullWidth
        />
      </Field>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
        <Button type="submit" variant="contained" disabled={pending} sx={{ flex: 1 }}>
          {submitLabel}
        </Button>
        {onSubmitAndNext ? (
          <Button variant="outlined" disabled={pending} onClick={onSubmitAndNext} sx={{ minWidth: 180 }}>
            <Trans>Save and next</Trans>
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
