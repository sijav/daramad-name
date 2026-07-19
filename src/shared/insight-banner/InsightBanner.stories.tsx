import type { Meta, StoryObj } from '@storybook/react-vite'
import { InsightBanner } from './InsightBanner'

const meta = {
  title: 'Shared/InsightBanner',
  component: InsightBanner,
} satisfies Meta<typeof InsightBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Fires above 50%. Scenario 4's «۷۰٪» is one instance of that rule, not a second threshold. */
export const ClientConcentration: Story = {
  args: {
    message: '73.2% of your income comes from one client (“Aria Trading”). If they leave, a large part of your income goes with them.',
  },
}
