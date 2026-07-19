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
    title: 'هنوز دریافتی‌ای ثبت نکردی',
    description: 'دفتر درآمد جاییه که همه‌ی پول‌هایی که گرفتی یک‌جا جمع می‌شه — همون چیزی که موقع گزارش گرفتن لازمت می‌شه.',
    actionLabel: 'ثبت اولین دریافتی',
  },
}

/** A filtered-to-empty ledger is a different situation and gets different words. */
export const NoFilterMatches: Story = {
  args: {
    title: 'با این فیلترها چیزی پیدا نشد',
    description: 'بازه‌ی تاریخ یا مشتری را عوض کن، یا فیلترها را پاک کن تا همه‌ی دریافتی‌ها را ببینی.',
    actionLabel: 'پاک کردن فیلترها',
  },
}
