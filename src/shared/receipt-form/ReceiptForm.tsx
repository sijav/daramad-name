import { Alert, Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { radius } from 'src/core/theme'
import { ChipSelect } from 'src/shared/chip-select'
import { CHANNEL_LABELS, CURRENCY_LABELS, CURRENCY_UNITS } from 'src/shared/constants'
import { DateField } from 'src/shared/date-field'
import { MoneyText } from 'src/shared/money-text'
import { NumberField } from 'src/shared/number-field'
import { clientsQueryKey, getClientsQuery } from 'src/shared/queries'
import { SegmentedControl } from 'src/shared/segmented-control'
import { CHANNELS, CURRENCIES, currencyDecimals, type Channel, type Currency } from 'src/shared/types'
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
 */
export const ReceiptForm = ({ form, submitLabel, pending = false, onSubmit, onSubmitAndNext }: ReceiptFormProps) => {
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
      <NumberField
        label="مبلغ دریافتی"
        value={state.amountOriginal}
        onValueChange={(value) => patch('amountOriginal', value)}
        decimals={currencyDecimals[state.currency]}
        error={showErrors && Boolean(errors.amountOriginal)}
        helperText={showErrors ? errors.amountOriginal : undefined}
        fullWidth
        autoFocus
        slotProps={{ input: { endAdornment: <Typography color="text.secondary">{CURRENCY_UNITS[state.currency]}</Typography> } }}
      />

      <SegmentedControl<Currency>
        value={state.currency}
        options={CURRENCIES.map((currency) => ({ value: currency, label: CURRENCY_LABELS[currency] }))}
        onValueChange={(currency) => {
          patch('currency', currency)
          // Clearing the rate when returning to toman stops a stale rate from
          // being silently reused if the user switches currency again.
          if (currency === 'TOMAN') {
            patch('rate', null)
          }
        }}
      />

      <DateField label="تاریخ دریافت" value={state.occurredAt} onValueChange={(iso) => patch('occurredAt', iso)} />

      {needsRate ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <NumberField
              label={isBackdated ? 'نرخ تبدیل در همان تاریخ (تومان)' : 'نرخ تبدیل روز (تومان)'}
              value={state.rate}
              onValueChange={(value) => patch('rate', value)}
              error={showErrors && Boolean(errors.rate)}
              helperText={showErrors ? errors.rate : undefined}
              fullWidth
            />

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                معادل تومانی
              </Typography>
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
            </Box>
          </Stack>

          {isBackdated ? (
            <Alert severity="info" sx={{ borderRadius: `${radius.md}px` }}>
              این دریافتی تاریخ گذشته داره. نرخ همون روز رو وارد کن، نه نرخ امروز — این مبلغ برای همیشه ثبت می‌شه و بعداً با تغییر قیمت عوض
              نمی‌شه.
            </Alert>
          ) : null}
        </Stack>
      ) : null}

      <Autocomplete
        freeSolo
        options={clients.map((client) => client.name)}
        value={state.clientName}
        onChange={(_event, value) => patch('clientName', value ?? '')}
        onInputChange={(_event, value) => patch('clientName', value)}
        renderInput={(params) => <TextField {...params} label="مشتری / پروژه" placeholder="اسم مشتری را بنویس یا انتخاب کن" />}
      />

      <ChipSelect<Channel>
        label="کانال دریافت"
        value={state.channel}
        options={CHANNELS.map((channel) => ({ value: channel, label: CHANNEL_LABELS[channel] }))}
        onValueChange={(channel) => patch('channel', channel)}
      />

      <TextField
        label="یادداشت (اختیاری)"
        value={state.note}
        onChange={(event) => patch('note', event.target.value)}
        placeholder="مثلاً: پیش‌پرداخت فاز اول طراحی"
        fullWidth
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
        <Button type="submit" variant="contained" disabled={pending} sx={{ flex: 1 }}>
          {submitLabel}
        </Button>
        {onSubmitAndNext ? (
          <Button variant="outlined" disabled={pending} onClick={onSubmitAndNext} sx={{ minWidth: 180 }}>
            ذخیره و بعدی
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
