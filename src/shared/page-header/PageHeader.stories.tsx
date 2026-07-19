import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageHeader } from './PageHeader'

const meta = {
  title: 'Shared/PageHeader',
  component: PageHeader,
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = { args: { title: 'تنظیمات' } }

export const WithSubtitle: Story = {
  args: { title: 'دفتر درآمد', subtitle: 'همه‌ی دریافتی‌هایت، با جمع دقیق' },
}

/** The action slot holds the year picker on the charts and report pages. */
export const WithAction: Story = {
  args: {
    title: 'نمودارها',
    subtitle: 'تصویر یک‌ساله‌ی درآمدت',
    action: <Button variant="outlined">۱۴۰۵</Button>,
  },
}
