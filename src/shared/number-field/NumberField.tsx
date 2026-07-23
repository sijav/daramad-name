import { TextField, type TextFieldProps } from '@mui/material'
import { useState, type CSSProperties } from 'react'
import { useSettings } from 'src/core/query'
import type { AppLocale } from 'src/shared/types'
import { formatNumber, parseUserNumber, toEnglishDigits } from 'src/shared/utils'

export type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onValueChange: (value: number | null) => void
  /** Decimal places allowed. 0 forces integers, toman has no sub-unit. */
  decimals?: number
  /** Shows thousands separators while typing. */
  grouped?: boolean
}

/**
 * Numeric input that takes Persian and English keyboards and normalises on
 * change.
 *
 * NOT `<input type="number">`: that rejects Persian digits outright, so «۲۵۰۰»
 * typed on a Persian keyboard produces nothing at all. This is a text input
 * with its own parsing, showing Persian digits and reporting a JS number up.
 *
 * The text derives from `value` except while focused, when a local draft takes
 * over. That follows external resets (form reset, loading a record to edit)
 * without an effect, and without reformatting mid-keystroke.
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

    // Report the value the field is SHOWING, not the raw parse. Rounding the
    // display while reporting the unrounded number meant a field reading «۱٫۵۶»
    // stored 1.555, and every surface after it printed 1.56 beside a Toman
    // figure derived from 1.555.
    const places = countDecimals(normalised, decimals)
    const shown = parsed === null ? null : Number(parsed.toFixed(places))

    setDraft(grouped && shown !== null ? formatNumber(shown, locale, places) : normalised)
    onValueChange(shown)
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
          // Merged, not replaced, callers (AmountField) set their own type
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
