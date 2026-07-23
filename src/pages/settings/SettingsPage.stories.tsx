import type { Meta, StoryObj } from '@storybook/react-vite'
import { db, readSettings } from 'src/core/db'
import { exportBackupMutation } from 'src/shared/queries'
import { seedDatabase } from 'src/shared/story-fixtures'
import { toPersianDigits, yearOf } from 'src/shared/utils'
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

    // Wait for a rendered Persian label before touching any mutation. The
    // backup path validates through `i18n._()`, and Lingui THROWS rather than
    // falling back when no locale is active yet — in the app that cannot happen
    // because routes are gated behind `localeReady`, but a story mounts the
    // page directly and the play function can outrun activation.
    const eraseButton = await canvas.findByRole('button', { name: /^پاک کردن همه$|^Erase all$/ })

    const before = (await db.receipts.toArray()).sort((left, right) => left.id.localeCompare(right.id))
    await expect(before.length).toBeGreaterThan(0)

    const json = JSON.stringify(await exportBackupMutation())

    await step('erase everything, typing the confirmation word', async () => {
      await userEvent.click(eraseButton)
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

/**
 * Language, theme and calendar are the three settings that must SURVIVE — the
 * whole point of persisting them is that the app opens the way the user left
 * it. Storybook's own toolbars drive the rendered locale and colour scheme, so
 * this asserts the two things the toolbars cannot stand in for: the choice
 * reaches IndexedDB, and the app re-reads it.
 *
 * Number rendering is the visible half of that. Persian numerals belong to the
 * Persian locale, not to the app; an English reader seeing «۱۴۰۵» is the exact
 * failure the language setting exists to prevent, so the year pill is checked
 * for Latin digits after the switch and Persian ones after switching back.
 */
export const DisplayPreferencesPersist: Story = {
  beforeEach: async () => {
    await db.settings.clear()
    return async () => await db.settings.clear()
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    // Re-queried each time rather than held: the pill is what re-renders when
    // the setting lands, so a stale node would never show the new numbering.
    const rangePill = async () => (await canvas.findByText(/^بازه گزارش:|^Report range:/)).textContent

    await step('switching the language persists it and changes the numbering', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^انگلیسی$|^English$/ }))
      await waitFor(async () => await expect((await readSettings()).locale).toBe('en-US'))
      await waitFor(async () => await expect(await rangePill()).toMatch(/\d{4}/))
      await expect(await rangePill()).not.toMatch(/[۰-۹]/)
    })

    await step('and switching back restores Persian numerals', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^فارسی$|^Persian$/ }))
      await waitFor(async () => await expect((await readSettings()).locale).toBe('fa-IR'))
      await waitFor(async () => await expect(await rangePill()).toMatch(/[۰-۹]{4}/))
    })

    await step('the colour scheme is a stored setting, not a session one', async () => {
      const dark = await canvas.findByRole('button', { name: /^تیره$|^Dark$/ })
      await userEvent.click(dark)
      await waitFor(async () => await expect((await readSettings()).themePreference).toBe('dark'))
      await waitFor(async () => await expect(dark).toHaveAttribute('aria-pressed', 'true'))
    })

    await step('so is the calendar', async () => {
      const gregorian = await canvas.findByRole('button', { name: /^میلادی$|^Gregorian$/ })
      await userEvent.click(gregorian)
      await waitFor(async () => await expect((await readSettings()).calendar).toBe('GREGORIAN'))
      await waitFor(async () => await expect(gregorian).toHaveAttribute('aria-pressed', 'true'))
    })

    /**
     * The pill on this very page is the one control the calendar switch can
     * break. Its year is a number IN a calendar, while its options are
     * re-derived from the receipts in the NEW one — so a stale «۱۴۰۵» is simply
     * absent from a Gregorian list, MUI drops the value, and the pill renders
     * empty on the screen that just changed it.
     */
    await step('and the range pill is renamed rather than emptied', async () => {
      await waitFor(async () => await expect(await rangePill()).toContain(toPersianDigits(yearOf(new Date(), 'GREGORIAN'))))
      await expect(await rangePill()).not.toContain(toPersianDigits(yearOf(new Date(), 'JALALI')))

      // Blank is not the only failure: an option list that does not contain the
      // value leaves nothing marked as chosen.
      const body = within(canvasElement.ownerDocument.body)
      await userEvent.click(await canvas.findByRole('combobox'))
      await expect(await body.findByRole('option', { selected: true })).toHaveTextContent(toPersianDigits(yearOf(new Date(), 'GREGORIAN')))
      await userEvent.keyboard('{Escape}')
    })
  },
}

/**
 * The identity block on the certificate, saved and read back.
 *
 * `fullNameEn`, `passportNumber` and `addressEn` exist ONLY for the English
 * document, so nothing in the Persian interface would look wrong if they were
 * dropped on the way to disk. The failure surfaces at an embassy counter, on a
 * certificate printing a Persian name where a passport spelling was expected.
 */
export const ProfileRoundTrip: Story = {
  beforeEach: async () => {
    await db.settings.clear()
    return async () => await db.settings.clear()
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    const typeInto = async (label: RegExp, value: string) => {
      const field = await canvas.findByRole('textbox', { name: label })
      await userEvent.clear(field)
      await userEvent.type(field, value)
    }

    await step('fill in the details the English certificate needs', async () => {
      await typeInto(/^نام و نام خانوادگی$|^Full name in Farsi$/, 'رها موسوی')
      await typeInto(/^نام و نام خانوادگی به انگلیسی$|^Full name in English$/, 'Raha Mousavi')
      await typeInto(/^شماره‌ی پاسپورت$|^Passport number$/, 'A98765432')
      await typeInto(/^نشانی به انگلیسی$|^Address in English$/, 'Karimkhan St, Tehran')
      await userEvent.click(await canvas.findByRole('button', { name: /^ذخیره مشخصات$|^Save details$/ }))
      await expect(await canvas.findByText(/^مشخصاتت ذخیره شد\.$|^Your details were saved\.$/)).toBeInTheDocument()
    })

    await step('every field reached the disk, including the newer ones', async () => {
      await waitFor(async () => {
        const { profile } = await readSettings()
        await expect(profile.fullName).toBe('رها موسوی')
        await expect(profile.fullNameEn).toBe('Raha Mousavi')
        await expect(profile.passportNumber).toBe('A98765432')
        await expect(profile.addressEn).toBe('Karimkhan St, Tehran')
      })
    })
  },
}

/**
 * The two-step confirmation, from the side that matters.
 *
 * `BackupSurvivesAWipe` proves the erase works. This proves it does NOT work
 * when the user has not typed the word — the entire reason the second step
 * exists. A confirmation that is merely decorative is worse than none, because
 * the dialog's presence is what makes the button safe to reach for.
 */
export const EraseRefusesTheWrongWord: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    const before = await db.receipts.count()
    await expect(before).toBeGreaterThan(0)

    await userEvent.click(await canvas.findByRole('button', { name: /^پاک کردن همه$|^Erase all$/ }))
    const confirm = await body.findByRole('button', { name: /^همه را پاک کن$|^Erase everything$/ })

    await step('a near miss leaves the button dead and the data alone', async () => {
      await userEvent.type(await body.findByRole('textbox'), 'پاک')
      await expect(confirm).toBeDisabled()
      await expect(await db.receipts.count()).toBe(before)
    })

    await step('the exact word, and only then, arms it', async () => {
      await userEvent.type(await body.findByRole('textbox'), ' کن')
      await waitFor(async () => await expect(confirm).toBeEnabled())
    })

    await step('backing out erases nothing', async () => {
      await userEvent.click(await body.findByRole('button', { name: /^انصراف$|^Cancel$/ }))
      await expect(await db.receipts.count()).toBe(before)
    })
  },
}

/**
 * A backup file that is not one.
 *
 * Restore REPLACES the database, so the file has to be validated before
 * anything is deleted — a file rejected halfway through would leave the user
 * with neither their ledger nor the file's. And per rule 9 the message has to
 * name what is wrong and what to do about it: "restore failed" tells someone
 * holding the only copy of their financial history nothing they can act on.
 */
export const RejectsABadBackupFile: Story = {
  beforeEach: async () => await seedDatabase(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    // A rendered Persian label first: the restore path resolves its messages
    // through `i18n._()`, which throws if no locale is active yet.
    await canvas.findByRole('button', { name: /^پاک کردن همه$|^Erase all$/ })
    const before = await db.receipts.count()
    await expect(before).toBeGreaterThan(0)

    const offer = async (name: string, contents: string) => {
      const input = canvasElement.ownerDocument.querySelector('input[type="file"]')
      await userEvent.upload(input as HTMLInputElement, new File([contents], name, { type: 'application/json' }))
      await userEvent.click(await body.findByRole('button', { name: /^بازیابی کن$|^Restore$/ }))
    }

    await step('a backup from another tool is named as such', async () => {
      await offer('other-tool.json', JSON.stringify({ app: 'ledger-app', version: 1, receipts: [], clients: [] }))
      // Names the problem, and points at the fix.
      await expect(
        await body.findByText(
          /^این فایل مال درآمدنامه نیست\. فایل بکاپ یه ابزار دیگه رو انتخاب کردی؟$|^This file is not from Daramadname\. Did you pick a backup from another tool\?$/,
        ),
      ).toBeInTheDocument()
    })

    await step('and so is a file that is not JSON at all', async () => {
      await offer('holiday-photo.json', 'this is not a backup')
      await expect(await body.findByText(/^این فایل JSON معتبر نیست\.|^This is not valid JSON\./)).toBeInTheDocument()
    })

    await step('and neither of them touched the ledger', async () => {
      await expect(await db.receipts.count()).toBe(before)
    })
  },
}
