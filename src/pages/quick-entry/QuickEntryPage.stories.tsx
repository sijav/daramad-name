import type { Meta, StoryObj } from '@storybook/react-vite'
import { QuickEntryPage } from './QuickEntryPage'

const meta = {
  title: 'Pages/QuickEntry',
  component: QuickEntryPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/quick-entry' } },
} satisfies Meta<typeof QuickEntryPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scenario 1's 15-second path. Opens on today's date, toman and card-to-card,
 * with the amount autofocused — so the fast path is type, tab, save.
 */
export const Default: Story = {}
