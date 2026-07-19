import type { Meta, StoryObj } from '@storybook/react-vite'
import { LedgerPage } from './LedgerPage'

const meta = {
  title: 'Pages/Ledger',
  component: LedgerPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/ledger' } },
} satisfies Meta<typeof LedgerPage>

export default meta
type Story = StoryObj<typeof meta>

/** Scenario 2: the toolbar, the totals that track the filter, and the paginated table. */
export const WithData: Story = {}

/** Nothing recorded yet — distinct from a filter that matched nothing. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/ledger' } } }
