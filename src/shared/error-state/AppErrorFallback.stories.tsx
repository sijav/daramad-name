import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppErrorFallback } from './AppErrorFallback'

const meta = {
  title: 'Shared/AppErrorFallback',
  component: AppErrorFallback,
} satisfies Meta<typeof AppErrorFallback>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Rule 9: no «خطایی رخ داد». It says what happened, reassures that the data is
 * intact, and gives the next step. The raw message is shown too — in a tool
 * holding financial history, hiding the cause would leave the user unable to
 * tell a glitch from real data loss.
 */
export const Default: Story = {
  args: {
    error: new Error('Failed to open IndexedDB: QuotaExceededError'),
    resetErrorBoundary: () => {},
  },
}
