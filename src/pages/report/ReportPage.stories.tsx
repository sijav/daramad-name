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
 * The document waits on `useCertificateModel`, which dynamically imports the
 * report's message catalog so the certificate can be written in a language the
 * interface is not in. On a cold module graph that import outruns
 * testing-library's one-second default, and only the first story in the file
 * fails, which reads like a bug in the page rather than a timeout.
 */
const findDocument = (canvasElement: HTMLElement, title: string) => within(canvasElement).findByText(title, undefined, { timeout: 10_000 })

export const WithData: Story = {
  parameters: seeded,
  // The other half of `WarnsWhenTheNameIsMissing`: a warning that is always on
  // screen is one the user reads past, so the quiet case is asserted too.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await findDocument(canvasElement, 'گواهی درآمد')
    await expect(canvas.queryByText(/اسمت هنوز ثبت نشده|Your name is not set yet/)).toBeNull()
  },
}

export const Empty: Story = { parameters: { page: { data: 'empty' } } }

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

    await step('and the printable link goes to the English document too', async () => {
      // `?lang=en` is the only thing that makes the new tab English, and this
      // page assembles that URL by hand rather than through the router. Get it
      // wrong and the user clicks "English", reads an English preview, then
      // hands a Persian page to an embassy.
      const link = await canvas.findByRole('link', { name: /قابل چاپ|printable document/i })
      await expect(link.getAttribute('href')).toContain('lang=en')
    })
  },
}

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
    let previousYear = ''

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
      previousYear = options[1].getAttribute('data-value') ?? ''
      await userEvent.click(options[1])
    })

    await step('there is nothing to certify, and the page says so instead', async () => {
      await expect(await canvas.findByText(/^برای این سال دریافتی‌ای ثبت نشده$|^No receipts recorded for this year$/)).toBeInTheDocument()
      await expect(canvas.queryByText('گواهی درآمد')).toBeNull()
      await expect(await canvas.findByRole('button', { name: /^دانلود PDF$|^Download PDF$/ })).toBeDisabled()
    })

    await step('the printable link carries the year that was picked', async () => {
      // The link is disabled here, but the URL is still built by hand from the
      // selected year, a range picker the document does not follow is the one
      // mismatch nothing else on this page would show.
      const link = await canvas.findByRole('link', { name: /قابل چاپ|printable document/i })
      await expect(previousYear).not.toBe('')
      await expect(link.getAttribute('href')).toContain(`year=${previousYear}`)
    })
  },
}

export const WarnsWhenTheNameIsMissing: Story = {
  beforeEach: async () => {
    // No settings row at all, so `readSettings` seeds the defaults, which
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
