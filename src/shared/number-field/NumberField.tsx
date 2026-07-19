import { TextField, type TextFieldProps } from '@mui/material'
import { useState, type CSSProperties } from 'react'
import { useSettings } from 'src/core/query'
import type { AppLocale } from 'src/shared/types'
import { formatNumber, parseUserNumber, toEnglishDigits } from 'src/shared/utils'

export type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onValueChange: (value: number | null) => void
  /** Decimal places allowed. 0 forces integers — toman has no sub-unit. */
  decimals?: number
  /** Shows thousands separators while typing. */
  grouped?: boolean
}

/**
 * Numeric input that accepts Persian *and* English keyboards and normalises on
 * change — rule 3 of the brief.
 *
 * Deliberately NOT `<input type="number">`: that control rejects Persian digits
 * outright, so a user typing «۲۵۰۰» on a Persian keyboard would see nothing
 * appear at all. This is a text input with its own parsing, displaying Persian
 * digits while reporting a plain JS number upward.
 *
 * The displayed text is derived from `value` except while the field is focused,
 * when a local draft takes over. That keeps the component in sync with external
 * resets (form reset, loading a record to edit) without an effect, and without
 * reformatting mid-keystroke.
 */
export const NumberField = ({ value, onValueChange, decimals = 0, grouped = true, ...props }: NumberFieldProps) => {
  const { locale } = useSettings()
  // Non-null only while the user is editing.
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? display(value, locale, decimals, grouped)

  const handleChange = (raw: string) => {
    if (raw === '') {
      setDraft('')
      onValueChange(null)
      return
    }

    // Keep only digits, one decimal point and a leading minus, after folding
    // Persian and Arabic-Indic digits down to ASCII.
    const normalised = toEnglishDigits(raw).replace(/[^\d.-]/g, '')
    const parsed = parseUserNumber(normalised)

    setDraft(grouped && parsed !== null ? formatNumber(parsed, locale, countDecimals(normalised, decimals)) : normalised)
    onValueChange(parsed)
  }

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={(event) => {
        setDraft(display(value, locale, decimals, grouped))
        props.onFocus?.(event)
      }}
      onBlur={(event) => {
        // Hand control back to `value`, which also re-applies canonical formatting.
        setDraft(null)
        props.onBlur?.(event)
      }}
      slotProps={{
        ...props.slotProps,
        htmlInput: {
          ...props.slotProps?.htmlInput,
          inputMode: 'decimal',
          dir: 'ltr',
          // Merged, not replaced — callers (AmountField) set their own type
          // scale here and would otherwise lose it.
          style: {
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            ...(props.slotProps?.htmlInput as { style?: CSSProperties } | undefined)?.style,
          },
        },
      }}
    />
  )
}

const display = (value: number | null, locale: AppLocale, decimals: number, grouped: boolean): string => {
  if (value === null) {
    return ''
  }
  return grouped ? formatNumber(value, locale, decimals) : value.toFixed(decimals)
}

/** Preserves the decimals the user has typed so far, so «۱۲.» does not snap to «۱۲». */
const countDecimals = (normalised: string, max: number): number => {
  if (max === 0) {
    return 0
  }
  const fraction = normalised.split('.')[1]
  return Math.min(fraction?.length ?? 0, max)
}
