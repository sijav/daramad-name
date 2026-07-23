import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { RowActionsMenu } from './RowActionsMenu'

const meta = {
  title: 'Shared/RowActionsMenu',
  component: RowActionsMenu,
  argTypes: {
    onView: { description: "Opens the details drawer. The only way to read a receipt's note and frozen rate." },
    onDelete: { description: "Asks to delete. The confirmation is the caller's, not this menu's." },
  },
} satisfies Meta<typeof RowActionsMenu>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { onView: fn(), onEdit: fn(), onDelete: fn() } }

const TRIGGER = /^عملیات$|^Actions$/
const VIEW = /^مشاهده جزئیات$|^View details$/
const EDIT = /^ویرایش$|^Edit$/
const DELETE = /^حذف$|^Delete$/

export const EachActionRunsItsOwnCallback: Story = {
  args: { onView: fn(), onEdit: fn(), onDelete: fn() },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    const open = async () => {
      await userEvent.click(await canvas.findByRole('button', { name: TRIGGER }))
      await body.findByRole('menu')
    }
    const closed = async () => await waitFor(() => expect(body.queryByRole('menu')).toBeNull())

    await step('the actions are hidden until the kebab is pressed', async () => {
      await canvas.findByRole('button', { name: TRIGGER })
      await expect(body.queryByRole('menuitem', { name: DELETE })).toBeNull()
    })

    await step('view details', async () => {
      await open()
      await userEvent.click(await body.findByRole('menuitem', { name: VIEW }))
      await expect(args.onView).toHaveBeenCalledTimes(1)
      await expect(args.onEdit).not.toHaveBeenCalled()
      await expect(args.onDelete).not.toHaveBeenCalled()
      // The menu closes on its own; leaving it open would keep the delete item
      // under the pointer of the next click.
      await closed()
    })

    await step('edit', async () => {
      await open()
      await userEvent.click(await body.findByRole('menuitem', { name: EDIT }))
      await expect(args.onEdit).toHaveBeenCalledTimes(1)
      await expect(args.onDelete).not.toHaveBeenCalled()
      await closed()
    })

    await step('delete', async () => {
      await open()
      await userEvent.click(await body.findByRole('menuitem', { name: DELETE }))
      await expect(args.onDelete).toHaveBeenCalledTimes(1)
      await expect(args.onView).toHaveBeenCalledTimes(1)
      await expect(args.onEdit).toHaveBeenCalledTimes(1)
      await closed()
    })
  },
}

export const DismissingRunsNothing: Story = {
  args: { onView: fn(), onEdit: fn(), onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.click(await canvas.findByRole('button', { name: TRIGGER }))
    await body.findByRole('menuitem', { name: DELETE })
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(args.onView).not.toHaveBeenCalled()
    await expect(args.onEdit).not.toHaveBeenCalled()
    await expect(args.onDelete).not.toHaveBeenCalled()
  },
}
