import { Trans, useLingui } from '@lingui/react/macro'
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material'
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
      <AmountField
        label={t`مبلغ دریافتی`}
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

      <DateField label={t`تاریخ دریافت`} value={state.occurredAt} onValueChange={(iso) => patch('occurredAt', iso)} />

      {needsRate ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Field
              label={isBackdated ? t`نرخ تبدیل در همان تاریخ (تومان)` : t`نرخ تبدیل روز (تومان)`}
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

            <Field label={t`معادل تومانی`}>
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  height: 52,
                  px: 2,
                  borderRadius: `${radius.md}px`,
                  backgroundColor: theme.palette.primary.light,
                })}
              >
                <MoneyText value={tomanPreview} variant="h3" color="primary.dark" />
              </Box>
            </Field>
          </Stack>

          {isBackdated ? (
            <Alert severity="info" sx={{ borderRadius: `${radius.md}px` }}>
              <Trans>
                این دریافتی تاریخ گذشته داره. نرخ همون روز رو وارد کن، نه نرخ امروز — این مبلغ برای همیشه ثبت می‌شه و بعداً با تغییر قیمت
                عوض نمی‌شه.
              </Trans>
            </Alert>
          ) : null}
        </Stack>
      ) : null}

      <Field label={t`مشتری / پروژه`}>
        <Autocomplete
          freeSolo
          options={clients.map((client) => client.name)}
          value={state.clientName}
          onChange={(_event, value) => patch('clientName', value ?? '')}
          onInputChange={(_event, value) => patch('clientName', value)}
          renderInput={(params) => <TextField {...params} placeholder={t`اسم مشتری را بنویس یا انتخاب کن`} />}
        />
      </Field>

      <ChipSelect<Channel>
        label={t`کانال دریافت`}
        value={state.channel}
        options={CHANNELS.map((channel) => ({ value: channel, label: i18n._(CHANNEL_LABELS[channel]) }))}
        onValueChange={(channel) => patch('channel', channel)}
      />

      <Field label={t`یادداشت (اختیاری)`}>
        <TextField
          value={state.note}
          onChange={(event) => patch('note', event.target.value)}
          placeholder={t`مثلاً: پیش‌پرداخت فاز اول طراحی`}
          fullWidth
        />
      </Field>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
        <Button type="submit" variant="contained" disabled={pending} sx={{ flex: 1 }}>
          {submitLabel}
        </Button>
        {onSubmitAndNext ? (
          <Button variant="outlined" disabled={pending} onClick={onSubmitAndNext} sx={{ minWidth: 180 }}>
            <Trans>ذخیره و بعدی</Trans>
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
