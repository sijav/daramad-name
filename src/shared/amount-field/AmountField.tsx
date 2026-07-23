import { useLingui } from '@lingui/react/macro'
import { Box, Typography } from '@mui/material'
import { radius } from 'src/core/theme'
import { CURRENCY_LABELS } from 'src/shared/constants'
import { Field } from 'src/shared/field'
import { NumberField } from 'src/shared/number-field'
import { currencyDecimals, type Currency } from 'src/shared/types'

export interface AmountFieldProps {
  label: string
  value: number | null
  currency: Currency
  onValueChange: (value: number | null) => void
  error?: boolean
  helperText?: string
  autoFocus?: boolean
}

/**
 * The design's `Amount Field`: a 72px box holding the amount set large and
 * bold, with the currency name after it on the trailing edge.
 *
 * It is deliberately the biggest control on the record card — the amount is the
 * one value the user always types, and the 15-second path depends on hitting it
 * without aiming.
 */
export const AmountField = ({ label, value, currency, onValueChange, error, helperText, autoFocus }: AmountFieldProps) => {
  const { i18n } = useLingui()

  return (
    <Field label={label} helperText={helperText} error={error}>
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: 72,
          px: 2.5,
          borderRadius: `${radius.lg}px`,
          backgroundColor: theme.palette.surfaceDefault,
          border: `1px solid ${error ? theme.palette.error.main : theme.palette.borderDefault}`,
          overflow: 'hidden',
        })}
      >
        <NumberField
          value={value}
          onValueChange={onValueChange}
          decimals={currencyDecimals[currency]}
          // Forwarded so MUI sets `aria-invalid`. The error state reached the
          // label and the box border but never the input, so the amount — the
          // field most likely to be blocking the save — signalled its problem
          // by a red hairline and nothing else.
          error={error}
          autoFocus={autoFocus}
          variant="standard"
          fullWidth
          slotProps={{
            input: { disableUnderline: true },
            htmlInput: {
              // The design sets 28px bold for the amount; `sx` on the root does
              // not reach the inner <input>, so the size is set here.
              style: { fontSize: 28, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
            },
          }}
        />
        <Typography variant="body1" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {i18n._(CURRENCY_LABELS[currency])}
        </Typography>
      </Box>
    </Field>
  )
}
