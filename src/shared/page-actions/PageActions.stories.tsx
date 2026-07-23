import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { toPersianDigits } from 'src/shared/utils'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PageActions, type PageActionsProps } from './PageActions'

// The cluster every page header carries. The pill is a MUI Select, which means
// it renders NOTHING when its value is absent from its options — no label, no
// fallback — so the cases where the two can disagree are what this file is
// about, not the happy path.

const THIS_YEAR = 1405

/**
 * The pill is controlled, so something has to hold the selection for it to move
 * at all. `year` is the starting one; the harness is remounted when that arg
 * changes so the Controls panel is not silently overruled by its own state.
 */
const Harness = ({ year: startingYear, years, onYearChange, formatYear }: PageActionsProps) => {
  const [year, setYear] = useState(startingYear)

  return (
    <PageActions
      year={year}
      years={years}
      formatYear={formatYear}
      // Both: the local setter so the pill moves, and the spy from args so the
      // Actions panel and the plays see what the page would have been told.
      onYearChange={(next) => {
        setYear(next)
        onYearChange(next)
      }}
    />
  )
}

const meta = {
  title: 'Shared/PageActions',
  // PageActions rather than the harness, so autodocs describes the props the
  // component actually documents.
  component: PageActions,
  render: (args) => <Harness key={args.year} {...args} />,
  // A router, because the record button navigates.
  parameters: {
    page: { route: '/report' },
  },
  argTypes: {
    year: { description: 'The selected report year, expressed in the calendar currently in force.' },
    years: { description: 'Years the ledger actually has receipts in. The selection is folded in if it is missing.' },
    onYearChange: { description: 'The page owns the selection; the pill only reports the change.' },
    formatYear: {
      control: false,
      description: 'Renders a year for display — Persian digits under a Jalali calendar.',
    },
  },
  args: {
    year: THIS_YEAR,
    years: [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2],
    onYearChange: fn(),
    formatYear: toPersianDigits,
  },
} satisfies Meta<typeof PageActions>

export default meta
type Story = StoryObj<typeof meta>

/** The pill names the selected year, and the menu offers the populated ones. */
export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
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
      // The page is told too — a pill that moves without reporting the change
      // would leave the figures on the year the user just left.
      await expect(args.onYearChange).toHaveBeenCalledWith(THIS_YEAR - 1)
    })
  },
}

/**
 * The other half of the cluster. It is the only way into the entry form from a
 * page header, so a button that renders but goes nowhere costs the user the
 * primary action on every screen at once.
 */
export const RecordingAReceipt: Story = {
  render: (args) => (
    <Routes>
      <Route path="/report" element={<Harness {...args} />} />
      <Route path="/quick-entry" element={<h1>the quick entry page</h1>} />
    </Routes>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: /^ثبت دریافتی$|^Record a receipt$/ }))
    await expect(await canvas.findByRole('heading', { name: 'the quick entry page' })).toBeInTheDocument()
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
  args: { years: [2026, 2025] },
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
  args: { years: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await expect(await canvas.findByText('بازه گزارش: سال ۱۴۰۵')).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('combobox'))
    await expect(await body.findByRole('option', { name: 'سال ۱۴۰۵' })).toHaveAttribute('aria-selected', 'true')
  },
}
