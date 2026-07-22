import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { enUS as enUSJalali, faIR } from 'date-fns-jalali/locale'
import { useSettings } from 'src/core/query'
import { fontFamilyFarsiDigits } from 'src/core/theme'
import { Field } from 'src/shared/field'
import type { CalendarSystem } from 'src/shared/types'

export interface DateFieldProps {
  label: string
  /**
   * ISO-8601 instant, or `null` for an empty field.
   *
   * Empty is a real state, not a missing one: the ledger's filter opens with no
   * range set, and showing today's date there would advertise a filter that is
   * not applied.
   */
  value: string | null
  onValueChange: (iso: string) => void
  /** Blocks future dates — a receipt cannot arrive tomorrow. */
  disableFuture?: boolean
  error?: boolean
  helperText?: string
  fullWidth?: boolean
}

/**
 * Jalali date picker (rule 4: the user only ever sees their own calendar).
 *
 * Uses MUI X's own `AdapterDateFnsJalali` rather than a bespoke calendar grid,
 * so leap years, month lengths and the Farvardin boundary come from a
 * maintained implementation instead of arithmetic written here. The adapter
 * swaps with the Settings toggle; the stored value stays an ISO instant either
 * way, so switching calendars never rewrites data.
 *
 * Persian numerals come from the Farsi-Digits font rather than from the
 * adapter. MUI X sizes each field section by probing
 * `formatByString(...).startsWith('0')` against ASCII '0', so an adapter that
 * emits real Persian digits makes the picker throw. Rendering ASCII through a
 * font whose 0-9 glyphs are Persian satisfies both sides.
 */
export const DateField = ({ label, value, onValueChange, disableFuture = true, error, helperText, fullWidth = true }: DateFieldProps) => {
  const { calendar, locale } = useSettings()
  // Persian numerals are a property of the Persian locale, not of the picker.
  const isPersian = locale === 'fa-IR'
  const digitFont = isPersian ? fontFamilyFarsiDigits : undefined

  return (
    <Field label={label} error={error} helperText={helperText}>
      <LocalizationProvider {...adapterProps(calendar, isPersian)}>
        <DatePicker
          value={value ? new Date(value) : null}
          disableFuture={disableFuture}
          onChange={(next) => next && !Number.isNaN(next.getTime()) && onValueChange(next.toISOString())}
          slotProps={{
            textField: {
              fullWidth,
              error,
              // v9 renders the field as a section list, not a plain <input>.
              // The inner section spans carry their OWN font-family from the
              // theme's typography, so inheriting from the root is not enough —
              // each span has to be named or the digits stay Latin.
              sx: {
                [[
                  '& .MuiPickersSectionList-root',
                  '& .MuiPickersInputBase-root',
                  '& .MuiPickersSectionList-section',
                  '& .MuiPickersSectionList-sectionContent',
                  '& input',
                ].join(', ')]: {
                  fontFamily: digitFont,
                },
              },
            },
            // The calendar popup's day cells need the same treatment.
            desktopPaper: { sx: { fontFamily: digitFont } },
            mobilePaper: { sx: { fontFamily: digitFont } },
          }}
        />
      </LocalizationProvider>
    </Field>
  )
}

/**
 * The Jalali adapter still drives the calendar in English — the calendar system
 * is a separate setting from the language — but with `date-fns-jalali`'s enUS
 * locale, which transliterates the month names ("28 Tir 1405") instead of
 * printing them in Persian script an English reader cannot parse.
 */
const adapterProps = (calendar: CalendarSystem, isPersian: boolean) =>
  calendar === 'JALALI'
    ? { dateAdapter: AdapterDateFnsJalali, adapterLocale: isPersian ? faIR : enUSJalali }
    : { dateAdapter: AdapterDateFns }
