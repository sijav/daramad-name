import { describe, expect, it } from 'vitest'
import { selectableYears } from './selectableYears'

// A year picker is a MUI Select, and a Select whose value is not among its
// options renders BLANK — no label, no fallback, just an empty pill beside the
// figures it is supposed to be describing. `getPopulatedYears` builds its list
// from the receipts that exist in the current calendar, so three ordinary
// situations produce exactly that: an empty ledger, a query still in flight,
// and a range chosen before the calendar setting was switched.

describe('selectableYears', () => {
  it('leaves a list that already contains the selection untouched', () => {
    const years = [1405, 1404, 1403]

    expect(selectableYears(years, 1404)).toEqual([1405, 1404, 1403])
  })

  it('offers the selected year when the ledger has no receipts at all', () => {
    expect(selectableYears([], 1405)).toEqual([1405])
  })

  // The calendar-switch case: the picker holds a Jalali year while the query
  // has re-derived its list in Gregorian.
  it('folds a selection from another calendar in rather than dropping it', () => {
    expect(selectableYears([2026, 2025], 1405)).toContain(1405)
  })

  it('keeps the list newest first however the selection got into it', () => {
    expect(selectableYears([2026, 2024], 2025)).toEqual([2026, 2025, 2024])
  })

  it('does not mutate the list it was given', () => {
    const years = [2026, 2025]

    selectableYears(years, 1405)

    expect(years).toEqual([2026, 2025])
  })
})
