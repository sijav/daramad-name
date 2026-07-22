import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { RowActionsMenu } from './RowActionsMenu'

const meta = { title: 'Shared/RowActionsMenu', component: RowActionsMenu } satisfies Meta<typeof RowActionsMenu>
export default meta
type Story = StoryObj<typeof meta>

/**
 * One trigger per ledger row. A menu rather than three inline icon buttons:
 * the row already carries a channel Tag and two money columns, and each action
 * gets a readable label instead of an icon to decode.
 */
export const Default: Story = { args: { onView: fn(), onEdit: fn(), onDelete: fn() } }

const TRIGGER = /^عملیات$|^Actions$/
const VIEW = /^مشاهده جزئیات$|^View details$/
const EDIT = /^ویرایش$|^Edit$/
const DELETE = /^حذف$|^Delete$/

/**
 * Every action in this menu is wired through the same `run()` helper, so a
 * swapped argument would send "delete" where "view" was clicked and nothing
 * would look wrong until a receipt disappeared. Each item is therefore clicked
 * separately and the other two spies are asserted to be untouched.
 *
 * The menu is portalled — it is NOT inside `canvasElement`, which is why the
 * items are queried from the document body.
 */
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

/**
 * Dismissing the menu must not run anything. The delete item sits one row below
 * the pointer, and this ledger has no server copy — a close that fired the
 * highlighted action would be unrecoverable.
 */
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
