import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilterButton } from './FilterButton'

const meta = { title: 'Shared/FilterButton', component: FilterButton } satisfies Meta<typeof FilterButton>
export default meta
type Story = StoryObj<typeof meta>

export const NoFilters: Story = { args: { activeCount: 0 } }

/** The badge carries state the popover hides once it is closed. */
export const TwoActive: Story = { args: { activeCount: 2 } }
