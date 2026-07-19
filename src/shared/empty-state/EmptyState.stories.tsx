import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** Rule 6: never a dead blank screen — say why the page matters, offer the first action. */
export const FirstRun: Story = {
  args: {
    icon: <ReceiptLongRoundedIcon />,
    title: 'You have not recorded any receipts yet',
    description:
      'The ledger is where every payment you have received adds up in one place — exactly what you need when it is time to produce a report.',
    actionLabel: 'Record your first receipt',
  },
}

/** A filtered-to-empty ledger is a different situation and gets different words. */
export const NoFilterMatches: Story = {
  args: {
    title: 'Nothing matched these filters',
    description: 'Change the date range or client, or clear the filters to see every receipt.',
    actionLabel: 'Clear filters',
  },
}
