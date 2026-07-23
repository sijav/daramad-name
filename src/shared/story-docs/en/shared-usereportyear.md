Holds the selected report year, and re-expresses it when the calendar system
changes. Without that, a Jalali year stays selected against a list of
Gregorian options and the range pill renders blank.

## stories

- `Starts On The Current Year`: The default: today's year, in the calendar in force, and it is on the list.
- `Switching The Calendar Renames The Year`: The bug, from both directions. A Jalali year is not a Gregorian one, so the number itself has to change, and it has to keep naming the period the user chose rather than snapping back to today, which would silently swap the range under a report they were part way through configuring.
- `The Selected Year Is Always An Option`: The invariant MUI actually needs: whatever the calendar, and whichever year is selected, the option list contains it. A select that cannot find its own value renders blank and warns, and neither of those is recoverable from the UI.
