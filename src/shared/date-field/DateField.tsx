import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { enUS as enUSPickers, faIR as faIRPickers } from '@mui/x-date-pickers/locales'
import { enUS as enUSJalali, faIR as faIRJalali } from 'date-fns-jalali/locale'
import { enUS, faIR } from 'date-fns/locale'
import { useId } from 'react'
import { useSettings } from 'src/core/query'
import { fontFamilyFarsiDigits } from 'src/core/theme'
import { Field } from 'src/shared/field'
import type { CalendarSystem } from 'src/shared/types'

export interface DateFieldProps {
  label: string
  value: string | null
  onValueChange: (iso: string) => void
  disableFuture?: boolean
  error?: boolean
  helperText?: string
  fullWidth?: boolean
}

/**
 * Jalali date picker. The stored value is an ISO instant whichever calendar is
 * selected, so switching calendars never rewrites data.
 *
 * Persian numerals come from the Farsi-Digits font, not the adapter: MUI X sizes
 * each field section by probing `formatByString(...).startsWith('0')` against
 * ASCII '0', so an adapter emitting Persian digits makes the picker throw.
 */
export const DateField = ({ label, value, onValueChange, disableFuture = true, error, helperText, fullWidth = true }: DateFieldProps) => {
  const { calendar, locale } = useSettings()
  // Digits follow the language, not the calendar: a Persian reader who switched
  // to the Gregorian calendar still reads Persian numerals.
  const isPersian = locale === 'fa-IR'
  const digitFont = isPersian ? fontFamilyFarsiDigits : undefined
  const labelId = useId()

  return (
    <Field label={label} labelId={labelId} error={error} helperText={helperText} fullWidth={fullWidth}>
      <LocalizationProvider {...adapterProps(calendar, isPersian)} localeText={pickerText(isPersian)}>
        <DatePicker
          value={value ? new Date(value) : null}
          disableFuture={disableFuture}
          onChange={(next) => next && !Number.isNaN(next.getTime()) && onValueChange(next.toISOString())}
          slotProps={{
            textField: {
              fullWidth,
              error,
              slotProps: {
                // The editable sections sit inside `role="group"`, which is not
                // a labelable element, so the `<label>` around `Field` names
                // the hidden input and leaves the group anonymous. MUI X wires
                // `aria-labelledby` itself only when the field carries its own
                // floating label, which this design does not use. Without this
                // a screen reader read the ledger's «from» and «to» filters as
                // six unattached spin buttons.
                input: { 'aria-labelledby': labelId },
              },
              sx: [
                // Every node the digit font has to be named on. The field is a
                // section list, and each span carries its own `font-family`
                // from the theme's typography, so setting it on the root leaves
                // the digits Latin. `input` is the hidden value input the
                // section list keeps alongside them.
                {
                  [[
                    '& .MuiPickersSectionList-root',
                    '& .MuiPickersInputBase-root',
                    '& .MuiPickersSectionList-section',
                    '& .MuiPickersSectionList-sectionContent',
                    '& input',
                  ].join(', ')]: { fontFamily: digitFont },
                },
                // An empty picker shows its «YYYY/MM/DD» template at MUI's
                // placeholder opacity of 0.42, which measures 2.7:1 against the
                // 4.5:1 WCAG asks for. The theme's `&::placeholder` rule gives
                // every other input solid `text.secondary` but does not reach a
                // section list. Scoped to empty and unfocused so a real date
                // keeps `text.primary`.
                value === null && {
                  '& .MuiPickersInputBase-root:not(.Mui-focused) .MuiPickersInputBase-sectionsContainer': {
                    opacity: 1,
                    color: 'text.secondary',
                  },
                },
              ],
            },
            // The calendar popup's day cells take the same font. MUI X's
            // accessibility guide asks for `aria-labelledby` on the `popper` and
            // `mobilePaper` slots when the toolbar is hidden and no field label
            // is set, which is this configuration; without it the calendar opens
            // as an unnamed `role="dialog"` (axe: `aria-dialog-name`).
            popper: { 'aria-labelledby': labelId },
            desktopPaper: { sx: { fontFamily: digitFont } },
            mobilePaper: { 'aria-labelledby': labelId, sx: { fontFamily: digitFont } },
          }}
        />
      </LocalizationProvider>
    </Field>
  )
}

/**
 * Calendar system and interface language are independent settings, so both
 * adapters take a locale for both languages. `date-fns-jalali`'s enUS
 * transliterates the month names ("28 Tir 1405") instead of printing Persian
 * script to an English reader, and without a locale the Gregorian adapter falls
 * back to enUS, which showed "July 2026" to a Persian one.
 *
 * No `date-fns` locale emits Persian digits, so MUI X's ASCII section probe
 * holds either way.
 */
const adapterProps = (calendar: CalendarSystem, isPersian: boolean) =>
  calendar === 'JALALI'
    ? { dateAdapter: AdapterDateFnsJalali, adapterLocale: isPersian ? faIRJalali : enUSJalali }
    : { dateAdapter: AdapterDateFns, adapterLocale: isPersian ? faIR : enUS }

/**
 * The picker's own copy, section names, open button, month arrows, view switch,
 * comes from MUI X's shipped catalogues rather than ours, which is why no lingui
 * id appears in this file. `localeText` is the supported hook for selecting one.
 * It is announced and not drawn, so the untranslated default went unnoticed: the
 * three sections read "Year", "Month", "Day" in a Persian interface.
 */
const pickerText = (isPersian: boolean) =>
  (isPersian ? faIRPickers : enUSPickers).components.MuiLocalizationProvider.defaultProps.localeText
