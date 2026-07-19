import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

const Toggleable: Story['render'] = function Render(args) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        باز کردن
      </Button>
      <ConfirmDialog {...args} open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
    </>
  )
}

export const DeleteReceipt: Story = {
  args: {
    open: true,
    title: 'حذف دریافتی',
    description: 'این دریافتی از دفتر حذف می‌شه و جمع‌ها و نمودارها به‌روز می‌شن. این کار برگشت‌پذیر نیست.',
    confirmLabel: 'حذف کن',
    destructive: true,
    onConfirm: () => {},
    onClose: () => {},
  },
  render: Toggleable,
}

/**
 * The two-step confirmation the brief requires before wiping everything: the
 * confirm button stays disabled until the exact word is typed.
 */
export const TypeToConfirm: Story = {
  args: {
    open: true,
    title: 'پاک کردن همه‌ی داده‌ها',
    description: 'همه‌ی دریافتی‌ها، مشتری‌ها و مشخصاتت برای همیشه پاک می‌شن. اگر بکاپ نگرفتی، برگشتی وجود نداره.',
    confirmLabel: 'همه را پاک کن',
    confirmationWord: 'پاک کن',
    destructive: true,
    onConfirm: () => {},
    onClose: () => {},
  },
  render: Toggleable,
}
