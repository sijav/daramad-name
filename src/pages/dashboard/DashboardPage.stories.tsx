import type { Meta, StoryObj } from '@storybook/react-vite'
import { DashboardPage } from './DashboardPage'

/**
 * Page stories render entirely from a seeded query cache — no IndexedDB. The
 * `page` parameter tells the global decorator to seed fixtures and supply a
 * router, so these are deterministic across runs and languages.
 */
const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
  parameters: { layout: 'fullscreen', page: { data: 'full' } },
} satisfies Meta<typeof DashboardPage>

export default meta
type Story = StoryObj<typeof meta>

/** «نمای کلی» — summary tiles, the year chart, client share, latest receipts and the report shortcut. */
export const WithData: Story = {}

/** First run: nothing recorded, so the page offers the first action instead of empty charts. */
export const Empty: Story = { parameters: { page: { data: 'empty' } } }
