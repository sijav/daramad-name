## props

- `label`: The caption above the picker.
- `onValueChange`: Fires only on a complete, valid date, so a half-typed year never reaches the caller.
- `disableFuture`: Blocks future dates, a receipt cannot arrive tomorrow.
- `error`: Marks the field, and turns the helper text red.
- `helperText`: What is wrong, or what the field expects.
- `fullWidth`: Stretches the picker to its container.
- `value`: ISO-8601 instant, or `null` for an empty field. Empty is a real state, not a missing one: the ledger's filter opens with no range set, and showing today's date there would advertise a filter that is not applied.

## stories

- `Jalali`: Jalali picker. The digits look Persian but the DOM value stays ASCII, MUI X measures each field section against ASCII '0', so the Persian numerals come from Vazirmatn's Farsi-Digits cut rather than from the adapter.
- `Is Named For Screen Readers`: Everything a screen reader is given, asserted in one place. The picker is not a text box: it renders `role="group"` around three `role="spinbutton"` sections, and a group is not a labelable element, so the `<label>` `Field` wraps the control in names the picker's hidden input and leaves the visible group anonymous. Both halves used to be wrong at once: the group had no name, and the section names came from MUI X's untranslated default, so a Persian interface announced "Year", "Month", "Day".
- `With Error`: The invalid state, where the helper line carries the reason. A red outline on its own says something is wrong without saying what, which on a date is the difference between a typo and an out-of-range day.
- `Allows Future`: Filters allow future dates; the receipt form does not. Both halves are asserted, because a `disableFuture` that silently stopped working looks exactly like one that is off on purpose.
- `Blocks Future`: The default, and the one the receipt form relies on: a receipt cannot arrive tomorrow.
- `Empty`: Empty is a real state, not a missing one. The ledger's filter opens with no range set, and defaulting to today there would advertise a filter that is not actually applied.
- `Picking A Day Reports An Iso Instant`: Choosing a day hands the caller an ISO INSTANT, not a Jalali string. That is what makes the calendar a display setting: switching to Gregorian in Settings re-reads the same stored value rather than rewriting any data.
- `English Keeps The Jalali Calendar`: The calendar system is a separate setting from the language, so an English interface still gets the Jalali calendar, with `date-fns-jalali`'s enUS locale, which transliterates the month names. Printing «تیر» to a reader who chose English is the whole reason that locale is passed.
