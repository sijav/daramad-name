import { useLingui } from '@lingui/react/macro'
import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
  argTypes: {
    destructive: { control: 'boolean' },
    // Every caller passes catalog messages for the copy, so the harness does
    // too. A text box here would put an English sentence above a Persian
    // cancel button, which is the one thing this dialog must never look like.
    title: { control: false },
    description: { control: false },
    confirmLabel: { control: false },
    cancelLabel: { control: false },
    confirmationWord: {
      control: false,
    },
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

type Copy = 'delete' | 'wipe' | 'seed'

/**
 * `open` is local because the dialog closes itself, but the spies from `args`
 * are called beside the setter, closing on screen and reporting upward are two
 * different things and only the second one deletes anything.
 */
const Harness = ({ copy, ...args }: ConfirmDialogProps & { copy: Copy }) => {
  const { t } = useLingui()
  const [open, setOpen] = useState(args.open)

  const wording = {
    delete: {
      title: t`Delete receipt`,
      description: t`This receipt is removed from the ledger and the totals and charts update. This cannot be undone.`,
      confirmLabel: t`Delete it`,
      confirmationWord: undefined,
    },
    wipe: {
      title: t`Erase all data`,
      description: t`Every receipt, client and personal detail is erased permanently. Without a backup there is no way back.`,
      confirmLabel: t`Erase everything`,
      confirmationWord: t`erase`,
    },
    seed: {
      title: t`Sample data`,
      description: t`Fill the ledger with sample receipts for testing and screenshots`,
      confirmLabel: t`Fill`,
      confirmationWord: undefined,
    },
  }[copy]

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {t`Open`}
      </Button>
      <ConfirmDialog
        {...args}
        {...wording}
        open={open}
        onConfirm={() => {
          setOpen(false)
          args.onConfirm()
        }}
        onClose={() => {
          setOpen(false)
          args.onClose()
        }}
      />
    </>
  )
}

const base = {
  open: true,
  destructive: true,
  title: '',
  description: '',
  confirmLabel: '',
  onConfirm: fn(),
  onClose: fn(),
}

/** The dialog is portalled, so it is never inside `canvasElement`. */
const dialog = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body)

export const DeleteReceipt: Story = {
  args: base,
  render: (args) => <Harness {...args} copy="delete" />,
  play: async ({ args, canvasElement }) => {
    const body = dialog(canvasElement)

    // No confirmation word on this one, so the button is live on open.
    const confirm = await body.findByRole('button', { name: /^حذف کن$|^Delete it$/ })
    await expect(confirm).toBeEnabled()

    await userEvent.click(confirm)
    await expect(args.onConfirm).toHaveBeenCalledTimes(1)
  },
}

export const TypeToConfirm: Story = {
  args: base,
  globals: { locale: 'fa-IR' },
  render: (args) => <Harness {...args} copy="wipe" />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const body = dialog(canvasElement)

    const confirm = await body.findByRole('button', { name: 'همه را پاک کن' })
    await expect(confirm).toBeDisabled()

    // A near miss is still a miss, the gate is the exact word, not a prefix.
    await userEvent.type(await body.findByRole('textbox'), 'پاک')
    await expect(confirm).toBeDisabled()

    await userEvent.type(await body.findByRole('textbox'), ' کن')
    await expect(confirm).toBeEnabled()

    await userEvent.click(await body.findByRole('button', { name: 'انصراف' }))
    await expect(args.onClose).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(body.queryByRole('textbox')).toBeNull())

    // The only button in the canvas, the dialog is portalled to <body>.
    await userEvent.click(await canvas.findByRole('button'))
    await expect(await body.findByRole('textbox')).toHaveValue('')
    await expect(await body.findByRole('button', { name: 'همه را پاک کن' })).toBeDisabled()
  },
}

export const NotDestructive: Story = {
  args: { ...base, destructive: false },
  render: (args) => <Harness {...args} copy="seed" />,
}
