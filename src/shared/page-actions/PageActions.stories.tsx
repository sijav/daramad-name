import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { toPersianDigits } from 'src/shared/utils'
import { expect, userEvent, within } from 'storybook/test'
import { PageActions } from './PageActions'

// The cluster every page header carries. The pill is a MUI Select, which means
// it renders NOTHING when its value is absent from its options — no label, no
// fallback — so the cases where the two can disagree are what this file is
// about, not the happy path.

const THIS_YEAR = 1405

const Harness = ({ years, from }: { years: number[]; from: number }) => {
  const [year, setYear] = useState(from)

  return <PageActions year={year} years={years} onYearChange={setYear} formatYear={toPersianDigits} />
}

const meta = {
  title: 'Shared/PageActions',
  component: Harness,
  // A router, because the record button navigates.
  parameters: { page: { route: '/report' } },
  args: { years: [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2], from: THIS_YEAR },
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

/** The pill names the selected year, and the menu offers the populated ones. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await expect(await canvas.findByText('بازه گزارش: سال ۱۴۰۵')).toBeInTheDocument()

    await step('every populated year is offered', async () => {
      await userEvent.click(await canvas.findByRole('combobox'))
      await expect(await body.findAllByRole('option')).toHaveLength(3)
    })

    await step('and picking one moves the pill', async () => {
      await userEvent.click(await body.findByRole('option', { name: 'سال ۱۴۰۴' }))
      await expect(await canvas.findByText('بازه گزارش: سال ۱۴۰۴')).toBeInTheDocument()
    })
  },
}

/**
 * The selected year is not in the list — exactly what a calendar switch
 * produces, since the populated years are re-derived in the new system while
 * the selection is still expressed in the old one.
 *
 * The pill has to keep naming its year and the menu has to keep it selected.
 * Without that MUI logs an out-of-range value and paints an empty pill, and the
 * user is left reading a page of figures with no idea what period they cover.
 */
export const AYearTheLedgerHasNoReceiptsIn: Story = {
  args: { years: [2026, 2025], from: THIS_YEAR },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await step('the pill is labelled, not blank', async () => {
      await expect(await canvas.findByText('بازه گزارش: سال ۱۴۰۵')).toBeInTheDocument()
    })

    await step('and the menu marks it as the current choice', async () => {
      await userEvent.click(await canvas.findByRole('combobox'))
      await expect(await body.findByRole('option', { name: 'سال ۱۴۰۵' })).toHaveAttribute('aria-selected', 'true')
      // Newest first, so the folded-in year sorts below the Gregorian ones.
      await expect((await body.findAllByRole('option')).map((option) => option.textContent)).toEqual(['سال ۲۰۲۶', 'سال ۲۰۲۵', 'سال ۱۴۰۵'])
    })
  },
}

/**
 * A brand-new user, before the years query has answered and before there is a
 * single receipt to derive a year from.
 */
export const NothingRecordedYet: Story = {
  args: { years: [], from: THIS_YEAR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await expect(await canvas.findByText('بازه گزارش: سال ۱۴۰۵')).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('combobox'))
    await expect(await body.findByRole('option', { name: 'سال ۱۴۰۵' })).toHaveAttribute('aria-selected', 'true')
  },
}
