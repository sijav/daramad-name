import { useLingui } from '@lingui/react/macro'
import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

const meta = { title: 'Shared/ConfirmDialog', component: ConfirmDialog } satisfies Meta<typeof ConfirmDialog>
export default meta
type Story = StoryObj<typeof meta>

const Harness = ({ typeToConfirm }: { typeToConfirm?: boolean }) => {
  const { t } = useLingui()
  const [open, setOpen] = useState(true)

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {t`Open`}
      </Button>
      <ConfirmDialog
        open={open}
        destructive
        title={typeToConfirm ? t`Erase all data` : t`Delete receipt`}
        description={
          typeToConfirm
            ? t`Every receipt, client and personal detail is erased permanently. Without a backup there is no way back.`
            : t`This receipt is removed from the ledger and the totals and charts update. This cannot be undone.`
        }
        confirmLabel={typeToConfirm ? t`Erase everything` : t`Delete it`}
        confirmationWord={typeToConfirm ? t`erase` : undefined}
        onConfirm={() => setOpen(false)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

const base = { open: true, title: '', description: '', confirmLabel: '', onConfirm: () => {}, onClose: () => {} }

export const DeleteReceipt: Story = { args: base, render: () => <Harness /> }

/**
 * The two-step confirmation the brief requires before wiping everything: the
 * confirm button stays disabled until the exact word is typed.
 */
export const TypeToConfirm: Story = { args: base, render: () => <Harness typeToConfirm /> }
