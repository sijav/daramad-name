import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import type { Receipt } from 'src/shared/types'
import { toPersianDigits, yearOf, yearRange } from 'src/shared/utils'
import { expect, waitFor, within } from 'storybook/test'
import { CertificatePage } from './CertificatePage'

// The route is configured entirely by its query string, so these stories differ
// only in `parameters.page.route`, which the harness hands to a `MemoryRouter`.

const thisYear = yearOf(new Date(), 'JALALI')

// The document waits on `loadReportI18n`, a dynamic catalog import that on a
// cold module graph outruns testing-library's 1s default.
const findDocument = (canvasElement: HTMLElement, text: string | RegExp) =>
  within(canvasElement).findByText(text, undefined, { timeout: 10_000 })

/** Any Persian money figure, «۱۸۷٬۲۶۰٬۰۰۰ تومان», as opposed to «۰ تومان». */
const MONEY = /[۰-۹]{1,3}٬[۰-۹]{3}٬[۰-۹]{3} تومان/

/**
 * Rows in the REAL database, dated inside the previous Jalali year.
 *
 * The page fixtures seed one report key, for the current year. `?year=` builds a
 * different key, so a past-year story misses the cache and reads Dexie, and an
 * empty Dexie totals zero, which the page answers with the no-income notice
 * rather than a document.
 */
const seedPreviousYear = async (): Promise<() => Promise<void>> => {
  const clear = () => db.receipts.clear()
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
  // play looks for by name. `bulkPut` so a re-seed cannot hit ConstraintError.
  await db.receipts.bulkPut([paid('prev-1', range.from, 187_260_000), paid('prev-2', midYear, 92_500_000)])
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
      await expect(await canvas.findAllByText(MONEY)).not.toHaveLength(0)
    })

    await step('nothing but the document and one print button', async () => {
      const buttons = await canvas.findAllByRole('button')
      await expect(buttons).toHaveLength(1)
      await expect(buttons[0]).toHaveAccessibleName(/^چاپ یا ذخیره به‌صورت PDF$|^Print or save as PDF$/)
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

    // The sheet carries its own language and direction; the interface around it
    // stays Persian and RTL.
    const sheet = heading.closest('[lang]')
    await expect(sheet).not.toBeNull()
    await expect(sheet).toHaveAttribute('lang', 'en-US')
    await expect(sheet).toHaveAttribute('dir', 'ltr')

    // Read across the whole sheet, so the month table and the amount written out
    // in words are covered too.
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

    // The seeded rows reach the page as money, not as «۰ تومان».
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
