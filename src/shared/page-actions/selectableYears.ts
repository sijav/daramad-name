/**
 * The options a year picker offers, guaranteed to contain the selected year.
 *
 * `getPopulatedYears` derives its list from the receipts that exist in the
 * CURRENT calendar, so it can legitimately not contain the year on screen: a
 * ledger with nothing in it yet, a query still in flight, or a range chosen
 * before the calendar setting was switched. A MUI Select whose value is absent
 * from its options renders BLANK and warns — and a blank range pill tells the
 * reader nothing about which year the figures beside it belong to.
 *
 * Newest first, matching `getPopulatedYears`, so the list stays in one order
 * however the selected year got into it.
 */
export const selectableYears = (years: number[], selected: number): number[] =>
  years.includes(selected) ? years : [...years, selected].sort((left, right) => right - left)
