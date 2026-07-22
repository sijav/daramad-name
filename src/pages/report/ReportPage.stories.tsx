import type { Meta, StoryObj } from '@storybook/react-vite'
import { db } from 'src/core/db'
import { seedDatabase } from 'src/shared/story-fixtures'
import { expect, userEvent, within } from 'storybook/test'
import { ReportPage } from './ReportPage'

// `data` is declared per story rather than on the meta, because Storybook
// MERGES parameters: once the meta seeds the query cache, a story that wants
// the real database cannot switch the seeding off again.
const meta = {
  title: 'Pages/Report',
  component: ReportPage,
  parameters: { layout: 'fullscreen', page: { route: '/report' } },
} satisfies Meta<typeof ReportPage>

export default meta
type Story = StoryObj<typeof meta>

const seeded = { page: { data: 'full' } }

/**
 * The document cannot appear until `useCertificateModel` has finished — and it
 * starts by DYNAMICALLY IMPORTING a second lingui instance plus a whole message
 * catalog, so the certificate can be written in a language the interface is not
 * in. On a cold module graph that import outruns testing-library's one-second
 * default and the first story in this file fails while the rest pass, which
 * reads like a bug in the page and is not one. The wait is stated instead.
 */
const findDocument = async (canvasElement: HTMLElement, title: string) =>
  await within(canvasElement).findByText(title, undefined, { timeout: 10_000 })

/**
 * Scenario 3. The fixture has a name set, so the "your name is not set" warning
 * is absent and the PDF button is live.
 */
export const WithData: Story = {
  parameters: seeded,
  /**
   * The other half of `WarnsWhenTheNameIsMissing`. A warning that is always on
   * screen is noise the user learns to read past, and then it is not there when
   * it matters — so the quiet case is asserted as deliberately as the loud one.
   */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await findDocument(canvasElement, 'گواهی درآمد')
    await expect(canvas.queryByText(/اسمت هنوز ثبت نشده|Your name is not set yet/)).toBeNull()
  },
}

/** No receipts for the year: the document cannot be produced, and the page says why. */
export const Empty: Story = { parameters: { page: { data: 'empty' } } }

/**
 * Scenario 3. The preview IS the document, so asserting on it asserts on what
 * prints — that equivalence is the whole reason the two share one model, and
 * it is what the reported "preview does not match the file" bug came from.
 *
 * Switching to English must change the VALUES, not just the labels: an embassy
 * officer cannot read «۶۴۴٬۲۶۰٬۰۰۰» or a Persian name.
 */
export const ProducesBothLanguages: Story = {
  parameters: seeded,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the Persian certificate', async () => {
      await expect(await findDocument(canvasElement, 'گواهی درآمد')).toBeInTheDocument()
      // Persian numerals, and the figure written out «به حروف» as an Iranian
      // financial document states it.
      await expect(await canvas.findByText(/به حروف/)).toBeInTheDocument()
      await expect(await canvas.findAllByText(/[۰-۹]{1,3}٬[۰-۹]{3}٬[۰-۹]{3}/)).not.toHaveLength(0)
    })

    await step('switch the document to English', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /انگلیسی|English/i }))
    })

    await step('the English certificate carries English values, not just labels', async () => {
      await expect(await findDocument(canvasElement, 'Statement of Income')).toBeInTheDocument()
      await expect(await canvas.findByText('Raha Mousavi')).toBeInTheDocument()
      await expect(await canvas.findByText(/In words/)).toBeInTheDocument()
      // Latin grouping, and the amount spelled out in English.
      await expect(await canvas.findAllByText(/\d{1,3},\d{3},\d{3}/)).not.toHaveLength(0)
    })
  },
}

/**
 * Changing the range from the config panel, to a year with nothing in it.
 *
 * A certificate that covers a year the holder recorded no income in is worse
 * than no certificate: it is a signed-looking statement that the person earned
 * zero. So the document is replaced by an explanation and both ways of taking
 * it away are switched off — and the year the panel says it is showing has to
 * be the year the document is built from, since nothing else on screen would
 * reveal a mismatch.
 */
export const AYearWithNoIncomeProducesNoDocument: Story = {
  parameters: seeded,
  beforeEach: async () => {
    // The previous year has to be genuinely empty, and the fixtures other
    // stories leave behind reach back far enough to land in it.
    const clear = async () => {
      await Promise.all([db.receipts.clear(), db.clients.clear()])
    }
    await clear()
    return clear
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)

    await step('the current year has a document', async () => {
      await expect(await findDocument(canvasElement, 'گواهی درآمد')).toBeInTheDocument()
      await expect(await canvas.findByRole('button', { name: /^دانلود PDF$|^Download PDF$/ })).toBeEnabled()
    })

    await step('pick the year before it', async () => {
      // Scoped to the config panel: the page header carries a range pill of its
      // own, and both are comboboxes.
      const panel = within((await canvas.findByText(/^تنظیمات گزارش$|^Report settings$/)).closest('.MuiPaper-root')!)
      await userEvent.click(await panel.findByRole('combobox'))
      const options = await body.findAllByRole('option')
      // Newest first, so the second option is the previous year.
      await userEvent.click(options[1])
    })

    await step('there is nothing to certify, and the page says so instead', async () => {
      await expect(await canvas.findByText(/^برای این سال دریافتی‌ای ثبت نشده$|^No receipts recorded for this year$/)).toBeInTheDocument()
      await expect(canvas.queryByText('گواهی درآمد')).toBeNull()
      await expect(await canvas.findByRole('button', { name: /^دانلود PDF$|^Download PDF$/ })).toBeDisabled()
    })
  },
}

/**
 * A certificate with no name on it.
 *
 * The document still renders — there is income to report — and that is exactly
 * the danger: it looks finished. Someone would print it, take it to a landlord
 * and be turned away, because an income statement that does not say WHOSE
 * income it is carries no weight at all. So the page has to say so before the
 * print button is used, and point at the one place that fixes it.
 *
 * Driven from the real database, since the warning comes from the stored
 * profile rather than from anything on this page.
 */
export const WarnsWhenTheNameIsMissing: Story = {
  beforeEach: async () => {
    // No settings row at all, so `readSettings` seeds the defaults — which
    // include an empty profile, exactly like a first run.
    await db.settings.clear()
    const clear = await seedDatabase()
    return async () => {
      await clear()
      await db.settings.clear()
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the document renders regardless, which is why the warning matters', async () => {
      await expect(await findDocument(canvasElement, 'گواهی درآمد')).toBeInTheDocument()
      // The name row is dropped rather than printed blank, so nothing on the
      // document itself reveals that it is unusable.
      await expect(canvas.queryByText(/^نام و نام خانوادگی$|^Full name$/)).toBeNull()
    })

    await step('the warning names the consequence and the fix', async () => {
      const warning = await canvas.findByRole('alert')
      await expect(warning.textContent).toMatch(/اسمت هنوز ثبت نشده|Your name is not set yet/)
      const link = await canvas.findByRole('link', { name: /از تنظیمات پرش کن|fill it in from Settings/ })
      await expect(link).toHaveAttribute('href', '/settings')
    })
  },
}
