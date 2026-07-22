import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { CalendarSystem } from 'src/shared/types'
import { yearOf } from 'src/shared/utils'
import { expect, userEvent, within } from 'storybook/test'
import { selectableYears } from './selectableYears'
import { useReportYear } from './useReportYear'

// Switching the calendar in Settings is the case that used to break: the year
// state was seeded once at mount, so it kept saying «۱۴۰۵» while the populated
// years had been re-derived as `2026`. MUI logged an out-of-range value and the
// range pill rendered EMPTY — on a screen whose whole job is to say which year
// the figures belong to.
//
// Two things are asserted here, and the second is the one that matters: the
// year is re-expressed in the new calendar rather than reset to today, and the
// option list can never fail to contain it.

const THIS_JALALI = yearOf(new Date(), 'JALALI')
const THIS_GREGORIAN = yearOf(new Date(), 'GREGORIAN')

/** Stands in for `getPopulatedYears`, which re-derives its list per calendar. */
const POPULATED: Record<CalendarSystem, number[]> = {
  JALALI: [THIS_JALALI, THIS_JALALI - 1],
  GREGORIAN: [THIS_GREGORIAN, THIS_GREGORIAN - 1],
}

const Harness = () => {
  const [calendar, setCalendar] = useState<CalendarSystem>('JALALI')
  const [year, setYear] = useReportYear(calendar)
  const options = selectableYears(POPULATED[calendar], year)

  return (
    <div>
      <button onClick={() => setCalendar('GREGORIAN')} type="button">
        gregorian
      </button>
      <button onClick={() => setCalendar('JALALI')} type="button">
        jalali
      </button>
      <button onClick={() => setYear(year - 1)} type="button">
        previous year
      </button>
      <dl>
        <dt>year</dt>
        <dd data-testid="year">{year}</dd>
        <dt>options</dt>
        <dd data-testid="options">{options.join(' ')}</dd>
      </dl>
    </div>
  )
}

const meta = {
  title: 'Shared/useReportYear',
  component: Harness,
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

const press = async (canvasElement: HTMLElement, name: string) => {
  await userEvent.click(await within(canvasElement).findByRole('button', { name }))
}

const shown = async (canvasElement: HTMLElement, testId: string) => (await within(canvasElement).findByTestId(testId)).textContent

/**
 * The default: today's year, in the calendar in force, and it is on the list.
 */
export const StartsOnTheCurrentYear: Story = {
  play: async ({ canvasElement }) => {
    await expect(await shown(canvasElement, 'year')).toBe(String(THIS_JALALI))
    await expect(await shown(canvasElement, 'options')).toContain(String(THIS_JALALI))
  },
}

/**
 * The bug, from both directions.
 *
 * A Jalali year is not a Gregorian one, so the number itself has to change —
 * and it has to keep naming the period the user chose rather than snapping back
 * to today, which would silently swap the range under a report they were part
 * way through configuring.
 */
export const SwitchingTheCalendarRenamesTheYear: Story = {
  play: async ({ canvasElement, step }) => {
    await step('the Gregorian name for the same stretch of time', async () => {
      await press(canvasElement, 'gregorian')
      await expect(await shown(canvasElement, 'year')).toBe(String(THIS_GREGORIAN))
    })

    await step('and it round-trips back', async () => {
      await press(canvasElement, 'jalali')
      await expect(await shown(canvasElement, 'year')).toBe(String(THIS_JALALI))
    })

    await step('a year the user picked is carried across, not discarded', async () => {
      await press(canvasElement, 'previous year')
      await expect(await shown(canvasElement, 'year')).toBe(String(THIS_JALALI - 1))
      await press(canvasElement, 'gregorian')
      // Jalali N - 1 overlaps Gregorian N - 1 for most of its length, so the
      // previous year stays the previous year.
      await expect(await shown(canvasElement, 'year')).toBe(String(THIS_GREGORIAN - 1))
    })
  },
}

/**
 * The invariant MUI actually needs: whatever the calendar, and whichever year is
 * selected, the option list contains it. A select that cannot find its own value
 * renders blank and warns, and neither of those is recoverable from the UI.
 */
export const TheSelectedYearIsAlwaysAnOption: Story = {
  play: async ({ canvasElement, step }) => {
    const holdsItsValue = async () => {
      const year = await shown(canvasElement, 'year')
      await expect((await shown(canvasElement, 'options'))?.split(' ')).toContain(year)
    }

    await step('on the current year', holdsItsValue)

    await step('on a year picked by hand', async () => {
      await press(canvasElement, 'previous year')
      await holdsItsValue()
    })

    await step('across a calendar switch', async () => {
      await press(canvasElement, 'gregorian')
      await holdsItsValue()
      await press(canvasElement, 'jalali')
      await holdsItsValue()
    })

    await step('and on a year the ledger has nothing in', async () => {
      await press(canvasElement, 'previous year')
      await press(canvasElement, 'previous year')
      await press(canvasElement, 'previous year')
      await holdsItsValue()
    })
  },
}
