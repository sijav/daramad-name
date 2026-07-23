import { useState } from 'react'
import type { CalendarSystem } from 'src/shared/types'
import { yearOf, yearRange } from 'src/shared/utils'

/**
 * The year a page's report range is set to, kept meaningful for the calendar in
 * force.
 *
 * A year is a number IN A CALENDAR: «۱۴۰۵» and «2026» name overlapping but
 * different stretches of time, so a year seeded at mount goes stale when
 * Settings switches system. The picker then holds a Jalali year among Gregorian
 * options, MUI reports it out of range and renders the control empty.
 *
 * The selection is re-expressed rather than reset, since the middle of the
 * chosen year is the same instant either way, so the user stays on the period
 * they picked. Adjusted DURING render, React's documented way to derive state
 * from a changing input; an effect would commit one frame holding the stale
 * year, and that frame is the blank control.
 */
export const useReportYear = (calendar: CalendarSystem): [number, (year: number) => void] => {
  const [year, setYear] = useState(() => yearOf(new Date(), calendar))
  const [shownIn, setShownIn] = useState(calendar)

  if (shownIn !== calendar) {
    setShownIn(calendar)
    setYear(convertYear(year, shownIn, calendar))
  }

  return [year, setYear]
}

/** The same stretch of time, named in the other calendar. */
const convertYear = (year: number, from: CalendarSystem, to: CalendarSystem): number => {
  const range = yearRange(year, from)
  const middle = new Date((Date.parse(range.from) + Date.parse(range.to)) / 2)
  return yearOf(middle, to)
}
