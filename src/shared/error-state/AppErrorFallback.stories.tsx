import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AppErrorFallback } from './AppErrorFallback'

const meta = {
  title: 'Shared/AppErrorFallback',
  component: AppErrorFallback,
} satisfies Meta<typeof AppErrorFallback>

export default meta
type Story = StoryObj<typeof meta>

const CAUSE = 'Failed to open IndexedDB: QuotaExceededError'

export const Default: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
}

export const TellsTheUserWhatToDo: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { name: /^یه جای کار خطا خورد$|^Something went wrong$/ })).toBeInTheDocument()

    // The one sentence that stops a user from panicking and clearing the site
    // data themselves.
    await expect(await canvas.findByText(/داده‌هایت سر جاشه|Your data is safe/)).toBeInTheDocument()

    // The cause, verbatim. A glitch and real corruption look identical without it.
    await expect(await canvas.findByText(CAUSE)).toBeInTheDocument()

    // Three ways out, in the order they should be tried, each with its control.
    await expect(await canvas.findByText(/دوباره نمایش صفحه را امتحان کن|Try rendering the page again/)).toBeInTheDocument()
    await expect(await canvas.findByText(/بارگذاری دوباره‌ی صفحه|Reload the page/)).toBeInTheDocument()
    await expect(await canvas.findByText(/بکاپ بگیر، پاک کن|Download a backup, erase/)).toBeInTheDocument()

    await expect(await canvas.findByRole('button', { name: /^دوباره امتحان کن$|^Try again$/ })).toBeEnabled()
    await expect(await canvas.findByRole('button', { name: /^بارگذاری دوباره$|^Reload$/ })).toBeEnabled()
    await expect(await canvas.findByRole('button', { name: /^دانلود$|^Download$/ })).toBeEnabled()
    await expect(await canvas.findByRole('button', { name: /^پاک کن و از نو شروع کن$|^Erase and restart$/ })).toBeEnabled()

    // The last resort is a PAIR in order, lettered so it reads as one step
    // rather than two independent buttons either of which could be pressed first.
    await expect(await canvas.findByText(/^(الف|A)\. (دانلود بکاپ|Download a backup)$/)).toBeInTheDocument()
  },
}

export const TryAgainRerenders: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: /^دوباره امتحان کن$|^Try again$/ }))

    await expect(args.resetErrorBoundary).toHaveBeenCalledTimes(1)
  },
}

export const TakesABackupBeforeErasing: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Await a rendered label first: the export path calls `i18n._()`, which
    // throws if no locale is active yet.
    const download = await canvas.findByRole('button', { name: /^دانلود$|^Download$/ })
    await userEvent.click(download)

    // Generous, because the export is real work racing the rest of the suite:
    // it validates every row in the shared IndexedDB while other story files
    // are seeding and clearing the same database in parallel. The default
    // one-second window made this pass alone and fail in a full run.
    await expect(await canvas.findByRole('button', { name: /^دانلود شد$|^Downloaded$/ }, { timeout: 10_000 })).toBeInTheDocument()
  },
}

export const ErasingNeedsTheWordTyped: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The dialog is portalled, so it is not inside `canvasElement`.
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.click(await canvas.findByRole('button', { name: /^پاک کن و از نو شروع کن$|^Erase and restart$/ }))

    await expect(await body.findByText(/^همه‌ی دریافتی‌ها|^Every receipt/)).toBeInTheDocument()

    const confirm = await body.findByRole('button', { name: /^همه را پاک کن$|^Erase everything$/ })
    await expect(confirm).toBeDisabled()

    await userEvent.type(await body.findByRole('textbox'), 'پاک کن')
    await expect(confirm).toBeEnabled()

    // Deliberately not confirmed: the real handler wipes the database and
    // navigates away, which would take the rest of the run with it.
  },
}

export const English: Story = {
  args: { error: new Error(CAUSE), resetErrorBoundary: fn() },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    await expect(await canvas.findByText('1')).toBeInTheDocument()
    await expect(await canvas.findByText('A. Download a backup')).toBeInTheDocument()
    await expect(canvas.queryByText('۱')).not.toBeInTheDocument()
    await expect(canvas.queryByText(/^الف\./)).not.toBeInTheDocument()
  },
}
