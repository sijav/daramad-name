import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { exportBackupMutation } from 'src/shared/queries'
import { seedDatabase } from 'src/shared/story-fixtures'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { SettingsPage } from './SettingsPage'

const meta = {
  title: 'Pages/Settings',
  component: SettingsPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/settings' } },
} satisfies Meta<typeof SettingsPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Profile, language, appearance, calendar, backup/restore and the destructive
 * reset. The language and appearance controls here change the persisted
 * setting, which in the app is what the Storybook toolbars stand in for.
 */
export const Default: Story = {}

/**
 * Scenario 6, driven through the real controls rather than the mutations.
 *
 * This is the one path where a bug costs the user everything: the whole
 * argument for having no backend is that a JSON file moves the ledger between
 * devices. If restore silently drops a field, fourteen days of records become
 * an empty demo — and nobody finds out until the file is the only copy left.
 *
 * So it wipes the database for real and brings it back through the file input,
 * then compares every field of every record rather than counting rows.
 */
export const BackupSurvivesAWipe: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    const before = (await db.receipts.toArray()).sort((left, right) => left.id.localeCompare(right.id))
    await expect(before.length).toBeGreaterThan(0)

    const json = JSON.stringify(await exportBackupMutation())

    await step('erase everything, typing the confirmation word', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^پاک کردن همه$|^Erase all$/ }))
      await userEvent.type(await body.findByRole('textbox'), 'پاک کن')
      await userEvent.click(await body.findByRole('button', { name: /^همه را پاک کن$|^Erase everything$/ }))
      await waitFor(async () => await expect(await db.receipts.count()).toBe(0))
    })

    await step('restore from the downloaded file', async () => {
      const input = canvasElement.ownerDocument.querySelector('input[type="file"]')
      await userEvent.upload(input as HTMLInputElement, new File([json], 'daramadname-backup.json', { type: 'application/json' }))
      await userEvent.click(await body.findByRole('button', { name: /^بازیابی کن$|^Restore$/ }))
      await waitFor(async () => await expect(await db.receipts.count()).toBe(before.length))
    })

    await step('every field came back, not just the row count', async () => {
      const after = (await db.receipts.toArray()).sort((left, right) => left.id.localeCompare(right.id))
      // Frozen rates and stored Toman equivalents especially — those are the
      // fields nothing downstream can reconstruct if they are lost.
      await expect(after).toEqual(before)
    })
  },
}
