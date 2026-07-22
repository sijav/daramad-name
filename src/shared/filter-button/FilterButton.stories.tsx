import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { FilterButton } from './FilterButton'

const meta = { title: 'Shared/FilterButton', component: FilterButton } satisfies Meta<typeof FilterButton>
export default meta
type Story = StoryObj<typeof meta>

export const NoFilters: Story = { args: { activeCount: 0 } }

/** The badge carries state the popover hides once it is closed. */
export const TwoActive: Story = { args: { activeCount: 2 } }

// The accessible name is computed from the button's content, so it picks the
// badge digit up too — anchor the start only.
const FILTERS = /^فیلترها|^Filters/

/**
 * The badge is the ONLY evidence that a filter is applied once the popover is
 * closed, so both of its states are load-bearing: a badge at zero says the
 * ledger is filtered when it is not, and a missing badge at two says the
 * opposite. Either way the user misreads how much they earned.
 *
 * The count also goes through `digits()`, so in Persian it must read «۲» — a
 * Latin "2" here would be the one Latin numeral on the toolbar.
 */
export const BadgeTracksTheCount: Story = {
  ...TwoActive,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: FILTERS })
    await expect(button).toHaveTextContent(/^فیلترها۲$|^Filters2$/)
  },
}

/** No filters applied means no badge at all — not a badge reading zero. */
export const NoBadgeWhenNothingIsApplied: Story = {
  ...NoFilters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: FILTERS })
    await expect(button).toHaveTextContent(/^فیلترها$|^Filters$/)
  },
}
