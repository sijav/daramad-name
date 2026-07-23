import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterButton } from './FilterButton'

const meta = {
  title: 'Shared/FilterButton',
  component: FilterButton,
  argTypes: {
    activeCount: { control: { type: 'number', min: 0, max: 99 } },
    disabled: { control: 'boolean' },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof FilterButton>

export default meta
type Story = StoryObj<typeof meta>

export const NoFilters: Story = { args: { activeCount: 0 } }

export const TwoActive: Story = { args: { activeCount: 2 } }

export const ManyFilters: Story = { args: { activeCount: 12 } }

export const Disabled: Story = { args: { activeCount: 0, disabled: true } }

// The accessible name is computed from the button's content, so it picks the
// badge digit up too, anchor the start only.
const FILTERS = /^فیلترها|^Filters/

export const BadgeTracksTheCount: Story = {
  ...TwoActive,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: FILTERS })
    await expect(button).toHaveTextContent(/^فیلترها۲$|^Filters2$/)
  },
}

export const NoBadgeWhenNothingIsApplied: Story = {
  ...NoFilters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: FILTERS })
    await expect(button).toHaveTextContent(/^فیلترها$|^Filters$/)
  },
}

export const PressingItOpensThePopover: Story = {
  ...TwoActive,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: FILTERS }))

    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
