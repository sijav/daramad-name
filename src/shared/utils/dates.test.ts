import { describe, expect, it } from 'vitest'
import { monthBucketsOfYear, monthsSpanned, yearOf, yearRange } from './dates'

// The Jalali boundary logic is the part most likely to be subtly wrong and
// least likely to be noticed — a year that starts in January instead of
// Farvardin produces totals that look plausible but are not the user's year.

describe('yearRange — Jalali years start at Farvardin, not January', () => {
  it('starts 1404 in March 2025, not January', () => {
    const { from } = yearRange(1404, 'JALALI')
    const start = new Date(from)
    expect(start.getFullYear()).toBe(2025)
    // Farvardin 1 falls on 20 or 21 March.
    expect(start.getMonth()).toBe(2)
    expect(start.getDate()).toBeGreaterThanOrEqual(20)
  })

  it('ends 1404 just before the next Farvardin', () => {
    const { to } = yearRange(1404, 'JALALI')
    const next = yearRange(1405, 'JALALI')
    expect(new Date(to).getTime()).toBeLessThan(new Date(next.from).getTime())
  })

  it('round-trips: every Jalali year range reports its own year', () => {
    for (const year of [1400, 1403, 1404, 1405, 1410]) {
      const { from, to } = yearRange(year, 'JALALI')
      expect(yearOf(new Date(from), 'JALALI')).toBe(year)
      expect(yearOf(new Date(to), 'JALALI')).toBe(year)
    }
  })

  it('uses January for Gregorian', () => {
    const { from } = yearRange(2025, 'GREGORIAN')
    expect(new Date(from).getMonth()).toBe(0)
    expect(new Date(from).getFullYear()).toBe(2025)
  })
})

describe('monthBucketsOfYear', () => {
  it('always returns twelve buckets, so empty months keep their zero bar', () => {
    expect(monthBucketsOfYear(1404, 'JALALI')).toHaveLength(12)
    expect(monthBucketsOfYear(2025, 'GREGORIAN')).toHaveLength(12)
  })

  it('produces contiguous, non-overlapping buckets', () => {
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    for (let index = 1; index < buckets.length; index += 1) {
      expect(new Date(buckets[index].from).getTime()).toBeGreaterThan(new Date(buckets[index - 1].to).getTime())
    }
  })

  it('covers the whole year', () => {
    const year = yearRange(1404, 'JALALI')
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    expect(new Date(buckets[0].from).getTime()).toBeLessThanOrEqual(new Date(year.from).getTime() + 1000)
    expect(new Date(buckets[11].to).getTime()).toBeGreaterThanOrEqual(new Date(year.to).getTime() - 1000)
  })
})

describe('monthsSpanned — the denominator of the monthly average', () => {
  it('counts a full year as twelve months', () => {
    expect(monthsSpanned(yearRange(1404, 'JALALI'), 'JALALI')).toBe(12)
  })

  it('counts elapsed months, not months that had income', () => {
    // Farvardin through Khordad is three months, whether or not all three earned.
    const buckets = monthBucketsOfYear(1404, 'JALALI')
    const range = { from: buckets[0].from, to: buckets[2].to }
    expect(monthsSpanned(range, 'JALALI')).toBe(3)
  })

  it('never returns zero, so the average can never divide by zero', () => {
    const now = new Date().toISOString()
    expect(monthsSpanned({ from: now, to: now }, 'JALALI')).toBe(1)
  })
})
