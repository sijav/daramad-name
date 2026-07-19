import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReportPage } from './ReportPage'

const meta = {
  title: 'Pages/Report',
  component: ReportPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/report' } },
} satisfies Meta<typeof ReportPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scenario 3. The fixture has a name set, so the "your name is not set" warning
 * is absent and the PDF button is live.
 */
export const WithData: Story = {}

/** No receipts for the year: the document cannot be produced, and the page says why. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/report' } } }
