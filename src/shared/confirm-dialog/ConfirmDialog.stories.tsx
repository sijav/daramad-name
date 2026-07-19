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
        Open
      </Button>
      <ConfirmDialog {...args} open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
    </>
  )
}

export const DeleteReceipt: Story = {
  args: {
    open: true,
    title: 'Delete receipt',
    description: 'This receipt is removed from the ledger and the totals and charts update. This cannot be undone.',
    confirmLabel: 'Delete it',
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
    title: 'Erase all data',
    description: 'Every receipt, client and personal detail is erased permanently. Without a backup there is no way back.',
    confirmLabel: 'Erase everything',
    confirmationWord: 'erase',
    destructive: true,
    onConfirm: () => {},
    onClose: () => {},
  },
  render: Toggleable,
}
