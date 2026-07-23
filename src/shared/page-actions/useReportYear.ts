import { useState } from 'react'
import type { CalendarSystem } from 'src/shared/types'
import { yearOf, yearRange } from 'src/shared/utils'

/**
 * The year a page's report range is set to, kept meaningful for the calendar
 * currently in force.
 *
 * A year is a number IN A CALENDAR, «۱۴۰۵» and «2026» name overlapping but
 * different stretches of time, so state seeded once from the calendar at mount
 * goes stale the moment Settings switches to the other system. The picker then
 * holds a Jalali year while every option is a Gregorian one: MUI logs an
 * out-of-range value and the control renders empty, leaving the user unable to
 * tell which year they are looking at.
 *
 * The selection is re-expressed rather than reset. The middle of the chosen
 * year is the same instant in either system, so reading its year back in the
 * new calendar keeps the user on the period they picked instead of throwing
 * them to today.
 *
 * Adjusted DURING render rather than in an effect, which is React's documented
 * way to derive state from a changing input: an effect would commit one frame
 * with the stale year, and that frame is the blank control this exists to
 * prevent.
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
