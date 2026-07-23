import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { CertificateModel } from './certificateModel'
import { IncomeCertificate } from './IncomeCertificate'

/**
 * The income certificate, as a page.
 *
 * This one component is both the on-screen preview and the printed sheet, so
 * there is no second renderer to drift from. `@page` gives it real A4 geometry:
 * what the browser prints is what the user saw.
 *
 * Its direction comes from the MODEL, not the app — an English certificate
 * reads left-to-right while the interface stays Persian.
 */
const meta = {
  title: 'Shared/IncomeCertificate',
  component: IncomeCertificate,
  argTypes: {
    model: {
      description:
        'Everything the document says, already localized and formatted.\n\nThe component renders it and nothing else — the model carries its own\ndirection and its own language, which is what lets a Persian interface\nproduce an English certificate.',
    },
    variant: {
      description:
        '`page` draws real A4 geometry for printing. `preview` drops the fixed\nheight and the paper shadow so the document can sit inside a card and\nflow with the page it is embedded in.',
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof IncomeCertificate>

export default meta
type Story = StoryObj<typeof meta>

// The model is written out rather than built, so a story exercises the PAGE and
// nothing else. What the builder puts in each field is `certificateModel.test.ts`.
//
// Written out is not the same as invented: the figures have to be a document the
// app could actually emit. The month rows sum to the total, the total over the
// four months of the period gives the average, and every month of the period has
// a row — `getIncomeReportQuery` buckets EVERY month in range, including empty
// ones, so a gap here would be a shape production cannot produce. The wording of
// the two long lines is the catalogue's, verbatim.
const persian: CertificateModel = {
  direction: 'rtl',
  locale: 'fa-IR',
  title: 'گواهی درآمد',
  subtitle: 'اظهارنامه‌ی خوداظهار درآمد آزاد',
  issuer: 'صادرشده توسط درآمدنامه',
  serialLabel: 'شماره‌ی مرجع',
  serial: 'DN-1405-4KZ9QF',
  identity: [
    { label: 'نام و نام خانوادگی', value: 'سینا جواهری' },
    { label: 'کد ملی', value: '۰۰۱۲۳۴۵۶۷۸' },
  ],
  summary: [
    { label: 'دوره‌ی گزارش', value: '۱ فروردین تا ۳۱ تیر ۱۴۰۵' },
    { label: 'تاریخ صدور', value: '۳۱ تیر ۱۴۰۵' },
    { label: 'میانگین درآمد ماهانه', value: '۱۶۱٬۰۶۵٬۰۰۰ تومان' },
  ],
  totalLabel: 'جمع کل درآمد',
  totalFigure: '۶۴۴٬۲۶۰٬۰۰۰ تومان',
  totalInWordsLabel: 'به حروف',
  totalInWords: 'ششصد و چهل و چهار میلیون و دویست و شصت هزار تومان',
  breakdownTitle: 'ریز ماه‌به‌ماه',
  columns: { month: 'ماه', count: 'تعداد دریافتی', amount: 'مبلغ' },
  months: [
    { key: '1405-1', month: 'فروردین ۱۴۰۵', count: '۲', amount: '۴۴٬۰۰۰٬۰۰۰ تومان' },
    { key: '1405-2', month: 'اردیبهشت ۱۴۰۵', count: '۳', amount: '۱۹۸٬۵۰۰٬۰۰۰ تومان' },
    { key: '1405-3', month: 'خرداد ۱۴۰۵', count: '۴', amount: '۱۸۷٬۲۶۰٬۰۰۰ تومان' },
    { key: '1405-4', month: 'تیر ۱۴۰۵', count: '۳', amount: '۲۱۴٬۵۰۰٬۰۰۰ تومان' },
  ],
  averageBasis: 'میانگین ماهانه: جمع کل تقسیم بر ۴ ماه این بازه.',
  footnote:
    'این سند از روی دریافتی‌هایی ساخته شده که دارنده‌ی آن خودش در درآمدنامه ثبت کرده است. یک سابقه‌ی شخصی است، نه سند بانکی یا مالیاتی، و برای ارائه در کنار صورت‌حساب‌های بانکی در نظر گرفته شده است.',
  incomplete: false,
}

const english: CertificateModel = {
  ...persian,
  direction: 'ltr',
  locale: 'en-US',
  title: 'Statement of Income',
  subtitle: 'A self-recorded statement of freelance income',
  issuer: 'Issued by Daramadname',
  serialLabel: 'Reference',
  identity: [
    { label: 'Full name', value: 'Sina Javaheri' },
    { label: 'National ID', value: '0012345678' },
  ],
  summary: [
    { label: 'Reporting period', value: '21 Mar 2026 — 22 Jul 2026' },
    { label: 'Issued on', value: '22 Jul 2026' },
    { label: 'Average monthly income', value: '161,065,000 Toman' },
  ],
  totalLabel: 'Total income',
  totalFigure: '644,260,000 Toman',
  totalInWordsLabel: 'In words',
  totalInWords: 'six hundred forty-four million two hundred sixty thousand Toman',
  breakdownTitle: 'Month-by-month breakdown',
  columns: { month: 'Month', count: 'Receipts', amount: 'Amount' },
  months: [
    { key: '1405-1', month: 'Farvardin 1405', count: '2', amount: '44,000,000 Toman' },
    { key: '1405-2', month: 'Ordibehesht 1405', count: '3', amount: '198,500,000 Toman' },
    { key: '1405-3', month: 'Khordad 1405', count: '4', amount: '187,260,000 Toman' },
    { key: '1405-4', month: 'Tir 1405', count: '3', amount: '214,500,000 Toman' },
  ],
  averageBasis: 'Monthly average: the total divided by 4 months of this period.',
  footnote:
    'This statement was produced from receipts the holder recorded themselves in Daramadname. It is a personal record, not a bank or tax authority document, and is intended to be read alongside supporting bank statements.',
}

/** The document itself — the sheet carries `lang`, which is what identifies it. */
const sheet = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLElement>('[lang]')

/**
 * The printable page: real A4 geometry and a paper shadow. This is the same
 * component the preview uses, so there is no second renderer to drift from.
 *
 * The play function checks that every field of the model reaches the page. A
 * field silently dropped here is a field the PDF prints and the preview does
 * not — which is exactly the drift the model was introduced to end.
 */
export const Page: Story = {
  args: { model: persian },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText('صادرشده توسط درآمدنامه')).toBeInTheDocument()
    await expect(await canvas.findByRole('heading', { level: 1, name: 'گواهی درآمد' })).toBeInTheDocument()
    await expect(await canvas.findByText('DN-1405-4KZ9QF')).toBeInTheDocument()

    // Identity and summary rows, label and value both.
    await expect(await canvas.findByText('کد ملی')).toBeInTheDocument()
    await expect(await canvas.findByText('۰۰۱۲۳۴۵۶۷۸')).toBeInTheDocument()
    await expect(await canvas.findByText('۱۶۱٬۰۶۵٬۰۰۰ تومان')).toBeInTheDocument()

    // The total, twice — figures and «به حروف». Words cannot be altered by
    // adding a zero, which is why the second form is on the page at all.
    await expect(await canvas.findByText('۶۴۴٬۲۶۰٬۰۰۰ تومان')).toBeInTheDocument()
    await expect(await canvas.findByText(/ششصد و چهل و چهار میلیون/)).toBeInTheDocument()

    // Every month of the period gets a row — the header plus one per month.
    await expect(await canvas.findAllByRole('row')).toHaveLength(persian.months.length + 1)
    await expect(await canvas.findByText('اردیبهشت ۱۴۰۵')).toBeInTheDocument()
    await expect(await canvas.findByText('۱۹۸٬۵۰۰٬۰۰۰ تومان')).toBeInTheDocument()
    await expect(await canvas.findByText('تیر ۱۴۰۵')).toBeInTheDocument()

    // The divisor and the disclaimer, which are what stop a clerk discarding it.
    await expect(await canvas.findByText(/تقسیم بر ۴ ماه این بازه/)).toBeInTheDocument()
    await expect(await canvas.findByText(/نه سند بانکی یا مالیاتی/)).toBeInTheDocument()

    // A4 at 96dpi is 210mm x 297mm — narrower than the container it sits in.
    const rect = sheet(canvasElement)!.getBoundingClientRect()
    await expect(Math.round(rect.width)).toBeGreaterThan(780)
    await expect(Math.round(rect.width)).toBeLessThan(800)
    await expect(rect.height).toBeGreaterThan(1100)
  },
}

/**
 * `preview` drops the fixed A4 geometry so the document can sit inside a card
 * on the report page and flow with it. Same content, no paper.
 */
export const Preview: Story = {
  args: { model: persian, variant: 'preview' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('heading', { level: 1, name: 'گواهی درآمد' })

    const rect = sheet(canvasElement)!.getBoundingClientRect()
    // Fills its container instead of holding a 210mm column inside it…
    await expect(rect.width).toBeGreaterThan(1000)
    // …and is only as tall as its content, not a fixed 297mm page.
    await expect(rect.height).toBeLessThan(1100)
  },
}

/**
 * The direction override, and the reason `direction` is on the model rather
 * than read from the app. An English certificate reads left to right while the
 * interface around it stays Persian — the document is for the embassy, not for
 * the user's screen.
 */
export const EnglishInsideAPersianApp: Story = {
  args: { model: english },
  // Pinned rather than inherited: the last assertion is about the APP's
  // direction, which the Language toolbar owns. Without this it only passes
  // while the toolbar happens to sit on its Persian default.
  globals: { locale: 'fa-IR' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { level: 1, name: 'Statement of Income' })
    const document_ = sheet(canvasElement)!

    await expect(document_).toHaveAttribute('dir', 'ltr')
    await expect(document_).toHaveAttribute('lang', 'en-US')
    // The app around it has not moved.
    await expect(canvasElement.ownerDocument.documentElement).toHaveAttribute('dir', 'rtl')

    await expect(await canvas.findByText('644,260,000 Toman')).toBeInTheDocument()
    // Not one Persian numeral on a page meant for someone who cannot read them.
    await expect(document_).not.toHaveTextContent(/[۰-۹]/)
  },
}

/**
 * A profile with nothing filled in. The identity block disappears entirely
 * rather than printing labels against blank space — an unfinished-looking form
 * is the one thing this document cannot afford to be.
 *
 * `incomplete` is set because it is what the builder would set for this profile,
 * but this component never reads it: the flag drives the report page's «نامت
 * هنوز ثبت نشده» banner, and that is where it is covered.
 */
export const WithoutIdentity: Story = {
  args: { model: { ...persian, identity: [], incomplete: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByRole('heading', { level: 1, name: 'گواهی درآمد' })
    await expect(canvas.queryByText('نام و نام خانوادگی')).not.toBeInTheDocument()
    await expect(canvas.queryByText('کد ملی')).not.toBeInTheDocument()
    // The rest of the document is unaffected.
    await expect(await canvas.findByText('۶۴۴٬۲۶۰٬۰۰۰ تومان')).toBeInTheDocument()
  },
}

/**
 * An amount past the largest named scale has no reading in words, so the model
 * hands the page an empty string. The row has to vanish with it — a «به حروف»
 * label with nothing beside it reads as a figure that was tampered with.
 */
export const WithoutTheTotalInWords: Story = {
  args: { model: { ...persian, totalInWords: '' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText('۶۴۴٬۲۶۰٬۰۰۰ تومان')).toBeInTheDocument()
    await expect(canvas.queryByText('به حروف')).not.toBeInTheDocument()
  },
}

/**
 * The sheet is paper in every theme. Its colours are literal rather than palette
 * roles for exactly this reason — a document that inverts because the reader
 * happened to have dark mode on is not a document, and the person receiving it
 * never chose the theme it was printed under.
 */
export const StaysPaperInDarkMode: Story = {
  args: { model: persian },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('heading', { level: 1, name: 'گواهی درآمد' })
    const document_ = sheet(canvasElement)!

    await expect(window.getComputedStyle(document_).backgroundColor).toBe('rgb(255, 255, 255)')
    // Ink, not the palette's light-on-dark text colour.
    await expect(window.getComputedStyle(document_).color).toBe('rgb(24, 25, 27)')
  },
}
