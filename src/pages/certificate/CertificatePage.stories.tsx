import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import type { Receipt } from 'src/shared/types'
import { toPersianDigits, yearOf, yearRange } from 'src/shared/utils'
import { expect, waitFor, within } from 'storybook/test'
import { CertificatePage } from './CertificatePage'

// The printable route takes its ENTIRE configuration from the query string
// there is no state, no props and no picker on the page. So these stories
// differ only in the URL the router is handed, which is exactly how the report
// page opens it in a new tab.
//
// The story harness supplies a `MemoryRouter` seeded from `parameters.page.route`,
// so `useSearchParams` reads a real search string here rather than a stub.
const thisYear = yearOf(new Date(), 'JALALI')

/**
 * Nothing paints until `useCertificateModel` resolves, and it begins by
 * DYNAMICALLY IMPORTING a second lingui instance plus a whole message catalog
 * that is what lets an English document be produced by a Persian interface. On
 * a cold module graph the import can outrun testing-library's one-second
 * default, so the wait is stated rather than left to flake.
 */
const findDocument = async (canvasElement: HTMLElement, text: string | RegExp) =>
  await within(canvasElement).findByText(text, undefined, { timeout: 10_000 })

/** Any Persian money figure, «۱۸۷٬۲۶۰٬۰۰۰ تومان», as opposed to «۰ تومان». */
const MONEY = /[۰-۹]{1,3}٬[۰-۹]{3}٬[۰-۹]{3} تومان/

/**
 * Rows in the REAL database, dated inside the previous Jalali year.
 *
 * The page fixtures seed one report key, for the current year. `?year=` builds a
 * different key, so a past-year story misses the cache and reads Dexie, and an
 * empty Dexie still produces a complete-looking certificate, because the report
 * query buckets every month of a finished year whether or not anything is in it.
 * Every assertion below would then pass against a document reading zero.
 */
const seedPreviousYear = async (): Promise<() => Promise<void>> => {
  const clear = async () => await db.receipts.clear()
  await clear()

  const range = yearRange(thisYear - 1, 'JALALI')
  const midYear = new Date((Date.parse(range.from) + Date.parse(range.to)) / 2).toISOString()
  const paid = (id: string, occurredAt: string, amountToman: number): Receipt => ({
    id,
    occurredAt,
    amountOriginal: amountToman,
    currency: 'TOMAN',
    rate: null,
    amountToman,
    clientId: null,
    channel: 'CARD_TO_CARD',
    note: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  })

  // The first instant of the year, so the row lands in Farvardin, the month the
  // play looks for by name.
  await db.receipts.bulkAdd([paid('prev-1', range.from, 187_260_000), paid('prev-2', midYear, 92_500_000)])
  return clear
}

const meta = {
  title: 'Pages/Certificate',
  component: CertificatePage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: `/certificate?year=${thisYear}` } },
} satisfies Meta<typeof CertificatePage>

export default meta
type Story = StoryObj<typeof meta>

export const Persian: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the document renders in Persian', async () => {
      await expect(await findDocument(canvasElement, 'گواهی درآمد')).toBeInTheDocument()
      // Persian numerals and the unit, not a bare figure.
      await expect(await canvas.findAllByText(/[۰-۹]{1,3}٬[۰-۹]{3}٬[۰-۹]{3} تومان/)).not.toHaveLength(0)
    })

    await step('nothing but the document and one print button', async () => {
      const buttons = await canvas.findAllByRole('button')
      await expect(buttons).toHaveLength(1)
      await expect(buttons[0]).toHaveAccessibleName(/^چاپ یا ذخیره به‌صورت PDF$|^Print or save as PDF$/)
      // Inside the `no-print` wrapper, so the button itself never prints.
      await expect(buttons[0].closest('.no-print')).not.toBeNull()
      await expect(canvas.queryByRole('navigation')).toBeNull()
      await expect(canvas.queryByRole('banner')).toBeNull()
    })

    await step('the saved file is named after the reference on the page', async () => {
      const reference = await canvas.findByText(new RegExp(`^DN-${thisYear}-`))
      await waitFor(async () => await expect(canvasElement.ownerDocument.title).toBe(reference.textContent))
    })
  },
}

export const English: Story = {
  parameters: { page: { data: 'full', route: `/certificate?year=${thisYear}&lang=en` } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const heading = await findDocument(canvasElement, 'Statement of Income')
    await expect(await canvas.findByText('Raha Mousavi')).toBeInTheDocument()

    // The document carries its own direction and language, independent of the
    // interface, which stays Persian and RTL around it.
    const sheet = heading.closest('[lang]')
    await expect(sheet).not.toBeNull()
    await expect(sheet).toHaveAttribute('lang', 'en-US')
    await expect(sheet).toHaveAttribute('dir', 'ltr')

    // Latin grouping present, Persian numerals absent, everywhere, including
    // the month table and the amount written out in words.
    await expect(sheet?.textContent).toMatch(/\d{1,3},\d{3},\d{3}/)
    await expect(sheet?.textContent).not.toMatch(/[۰-۹]/)
  },
}

export const AnotherYear: Story = {
  parameters: { page: { data: 'full', route: `/certificate?year=${thisYear - 1}` } },
  beforeEach: seedPreviousYear,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Every row of the breakdown belongs to the requested year, not to today's.
    await findDocument(canvasElement, new RegExp(`^DN-${thisYear - 1}-`))
    await expect(await canvas.findAllByText(new RegExp(`فروردین ${toPersianDigits(thisYear - 1)}`))).not.toHaveLength(0)
    await expect(canvas.queryByText(new RegExp(`فروردین ${toPersianDigits(thisYear)}`))).toBeNull()

    // And it carries that year's money. Without this the story passed just as
    // happily against twelve zero rows.
    await expect(await canvas.findAllByText(MONEY)).not.toHaveLength(0)
  },
}

export const NoIncomeForThatYear: Story = {
  parameters: { page: { data: 'empty', route: `/certificate?year=${thisYear}` } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      await findDocument(canvasElement, /^برای این سال دریافتی‌ای ثبت نشده$|^No receipts recorded for this year$/),
    ).toBeInTheDocument()

    // No document at all, not a document with zeros in it.
    await expect(canvas.queryByRole('heading', { level: 1 })).toBeNull()
    await expect(canvas.queryByText(new RegExp(`^DN-${thisYear}-`))).toBeNull()
    await expect(canvas.queryByText(MONEY)).toBeNull()
    // And nothing to print.
    await expect(await canvas.findByRole('button', { name: /^چاپ یا ذخیره به‌صورت PDF$|^Print or save as PDF$/ })).toBeDisabled()
  },
}
