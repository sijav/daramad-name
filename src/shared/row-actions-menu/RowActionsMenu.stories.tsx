import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RowActionsMenu } from './RowActionsMenu'

const meta = { title: 'Shared/RowActionsMenu', component: RowActionsMenu } satisfies Meta<typeof RowActionsMenu>
export default meta
type Story = StoryObj<typeof meta>

/**
 * One trigger per ledger row. A menu rather than three inline icon buttons:
 * the row already carries a channel Tag and two money columns, and each action
 * gets a readable label instead of an icon to decode.
 */
export const Default: Story = { args: { onView: fn(), onEdit: fn(), onDelete: fn() } }
