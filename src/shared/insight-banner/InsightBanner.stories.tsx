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
  args: { message: '۷۳.۲٪ درآمدت از یک مشتری است («بازرگانی آریا»). اگر این مشتری برود، بخش بزرگی از درآمدت می‌رود.' },
}
