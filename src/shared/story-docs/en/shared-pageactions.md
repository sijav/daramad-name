## props

- `year`: The selected report year, expressed in the calendar currently in force.
- `years`: Years the ledger actually has receipts in. The selection is folded in if it is missing.
- `onYearChange`: The page owns the selection; the pill only reports the change.
- `formatYear`: Renders a year for display, Persian digits under a Jalali calendar.

## stories

- `Default`: The pill names the selected year, and the menu offers the populated ones.
- `Recording A Receipt`: The other half of the cluster. It is the only way into the entry form from a page header, so a button that renders but goes nowhere costs the user the primary action on every screen at once.
- `A Year The Ledger Has No Receipts In`: The selected year is not in the list, exactly what a calendar switch produces, since the populated years are re-derived in the new system while the selection is still expressed in the old one. The pill has to keep naming its year and the menu has to keep it selected. Without that MUI logs an out-of-range value and paints an empty pill, and the user is left reading a page of figures with no idea what period they cover.
- `Nothing Recorded Yet`: A brand-new user, before the years query has answered and before there is a single receipt to derive a year from.
