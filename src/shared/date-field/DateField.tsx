import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { enUS as enUSPickers, faIR as faIRPickers } from '@mui/x-date-pickers/locales'
import { enUS as enUSJalali, faIR as faIRJalali } from 'date-fns-jalali/locale'
import { useId } from 'react'
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
  const labelId = useId()

  return (
    <Field label={label} labelId={labelId} error={error} helperText={helperText}>
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
                // The editable sections sit inside `role="group"`, and a group
                // is NOT a labelable element — the `<label>` `Field` wraps
                // everything in therefore names the picker's hidden input and
                // nothing else, leaving the visible group anonymous. MUI X
                // only wires `aria-labelledby` itself when the field is given
                // its own floating `label`, which this design does not use, so
                // the association is spelled out here.
                //
                // Without it a screen reader announced three unattached spin
                // buttons — "year", "month", "day" — with no way to tell the
                // ledger's «from» filter from its «to».
                input: { 'aria-labelledby': labelId },
              },
              // v9 renders the field as a section list, not a plain <input>.
              // The inner section spans carry their OWN font-family from the
              // theme's typography, so inheriting from the root is not enough —
              // each span has to be named or the digits stay Latin.
              sx: [
                {
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
                // An empty picker shows its «YYYY/MM/DD» template through MUI's
                // placeholder opacity (0.42), which lands the hint at 2.7:1 —
                // below the 4.5:1 WCAG asks for, on the one control the ledger
                // filter opens with. Every other input in the app already
                // renders its placeholder as solid `text.secondary` (see the
                // `&::placeholder` rule in the theme); this matches them.
                //
                // Scoped to the empty, unfocused state so a real date keeps the
                // full-strength `text.primary` it is entitled to.
                value === null && {
                  '& .MuiPickersInputBase-root:not(.Mui-focused) .MuiPickersInputBase-sectionsContainer': {
                    opacity: 1,
                    color: 'text.secondary',
                  },
                },
              ],
            },
            // The calendar popup's day cells need the same treatment.
            //
            // Both papers are also pointed at the label: MUI X's accessibility
            // guide says to pass `aria-labelledby` to the `popper` and
            // `mobilePaper` slots whenever the toolbar is hidden AND no field
            // label is set, which is exactly this configuration. Without it the
            // calendar opens as an unnamed `role="dialog"` (axe:
            // `aria-dialog-name`).
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
 * The Jalali adapter still drives the calendar in English — the calendar system
 * is a separate setting from the language — but with `date-fns-jalali`'s enUS
 * locale, which transliterates the month names ("28 Tir 1405") instead of
 * printing them in Persian script an English reader cannot parse.
 */
const adapterProps = (calendar: CalendarSystem, isPersian: boolean) =>
  calendar === 'JALALI'
    ? { dateAdapter: AdapterDateFnsJalali, adapterLocale: isPersian ? faIRJalali : enUSJalali }
    : { dateAdapter: AdapterDateFns }

/**
 * The picker's OWN copy — section names, the open button, the month arrows, the
 * view switch — comes from MUI X, not from our catalogue.
 *
 * It is announced, not drawn, so it was invisible in review while every one of
 * those strings stayed English in a Persian interface: the three editable
 * sections read "Year", "Month", "Day" and the trigger read "Choose date,
 * selected date is …". `localeText` is MUI X's supported hook for this, and the
 * library ships the Persian catalogue itself, so nothing is re-translated here
 * (which is also why no lingui id appears in this file).
 */
const pickerText = (isPersian: boolean) =>
  (isPersian ? faIRPickers : enUSPickers).components.MuiLocalizationProvider.defaultProps.localeText
