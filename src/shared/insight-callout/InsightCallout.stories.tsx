import type { Meta, StoryObj } from '@storybook/react-vite'
import { InsightCallout } from './InsightCallout'

const meta = { title: 'Shared/InsightCallout', component: InsightCallout } satisfies Meta<typeof InsightCallout>
export default meta
type Story = StoryObj<typeof meta>

/** Fires above 50% client concentration — a risk worth naming, not an error. */
export const Concentration: Story = {
  args: { message: '۷۳٫۲٪ از درآمد شما از یک مشتری تأمین شده است.' },
}

export const Info: Story = { args: { message: 'مرداد امسال هیچ دریافتی ثبت نشده است.', tone: 'info' } }
export const Positive: Story = { args: { message: 'درآمد امسال ۲۴٪ بیشتر از سال گذشته است.', tone: 'positive' } }
