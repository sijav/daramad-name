import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { faIR } from 'date-fns-jalali/locale'
import { useSettings } from 'src/core/query'
import { fontFamilyFarsiDigits } from 'src/core/theme'
import type { CalendarSystem } from 'src/shared/types'

export interface DateFieldProps {
  label: string
  /** ISO-8601 instant. */
  value: string
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
  const { calendar } = useSettings()

  return (
    <LocalizationProvider {...adapterProps(calendar)}>
      <DatePicker
        label={label}
        value={new Date(value)}
        disableFuture={disableFuture}
        onChange={(next) => next && !Number.isNaN(next.getTime()) && onValueChange(next.toISOString())}
        slotProps={{
          textField: {
            fullWidth,
            error,
            helperText,
            // v9 renders the field as a section list, not a plain <input>.
            sx: {
              '& .MuiPickersSectionList-root, & .MuiPickersInputBase-root, & input': {
                fontFamily: fontFamilyFarsiDigits,
              },
            },
          },
          // The calendar popup's day cells need the same treatment.
          desktopPaper: { sx: { fontFamily: fontFamilyFarsiDigits } },
          mobilePaper: { sx: { fontFamily: fontFamilyFarsiDigits } },
        }}
      />
    </LocalizationProvider>
  )
}

const adapterProps = (calendar: CalendarSystem) =>
  calendar === 'JALALI' ? { dateAdapter: AdapterDateFnsJalali, adapterLocale: faIR } : { dateAdapter: AdapterDateFns }
