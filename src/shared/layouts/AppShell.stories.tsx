import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PageHeader } from 'src/shared/page-header'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AppShell } from './AppShell'

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const Frame = ({ path }: { path: string }) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="*"
          element={
            <>
              <PageHeader title="Ledger" subtitle="Every receipt you have, with an exact total" />
              <SurfaceCard sx={{ minHeight: 240 }}>Page content</SurfaceCard>
            </>
          }
        />
      </Route>
    </Routes>
  </MemoryRouter>
)

/** The permanent rail's paper, which only exists when the rail is permanent. */
const permanentRail = (canvasElement: HTMLElement) =>
  canvasElement.ownerDocument.querySelector<HTMLElement>('.MuiDrawer-root:not(.MuiDrawer-modal) .MuiDrawer-paper')

/** Desktop: a permanent nav rail on the right, since the layout is RTL. */
export const Desktop: Story = {
  render: () => <Frame path="/ledger" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The rail is here and carries the FULL label, which is what the design draws.
    await expect(await canvas.findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()

    // …and none of the phone chrome is. A hamburger beside a permanent rail is
    // two ways to reach the same six links.
    await expect(canvas.queryByRole('button', { name: /^باز کردن منو$|^Open menu$/ })).not.toBeInTheDocument()
    await expect(canvas.queryByText(/^گزارش$|^Report$/)).not.toBeInTheDocument()
  },
}

/**
 * The direction test. The rail is anchored `left` in BOTH directions because the
 * stylis RTL plugin rewrites the generated CSS — swapping the anchor by hand
 * double-flips it, which is exactly what put the rail on the wrong side once.
 * So this asserts where the rail actually LANDS, not what it was passed.
 */
export const RailSitsOnTheReadingSide: Story = {
  render: () => <Frame path="/ledger" />,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(/^گزارش درآمد$/)

    const rail = permanentRail(canvasElement)
    await expect(rail).not.toBeNull()
    // Persian reads right to left, so the rail belongs on the right.
    await expect(rail!.getBoundingClientRect().left).toBeGreaterThan(window.innerWidth / 2)
  },
}

/** The same frame in English: LTR, so the rail is on the left. */
export const EnglishRailFlips: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Income report')

    const rail = permanentRail(canvasElement)
    await expect(rail).not.toBeNull()
    await expect(rail!.getBoundingClientRect().right).toBeLessThan(window.innerWidth / 2)
  },
}

/**
 * 834px is the width of every tablet frame in the design, and every one of them
 * draws the permanent rail. MUI's `md` is 900, so the breakpoint is written as
 * 768 — at `md` a tablet got the hamburger, the temporary drawer and the bottom
 * bar against a design that has none of them.
 */
export const Tablet: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'tablet', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /^باز کردن منو$|^Open menu$/ })).not.toBeInTheDocument()
  },
}

/**
 * Mobile gets a thumb-reachable bottom bar rather than only a drawer — rule 1
 * says half the demo-link traffic arrives on a phone.
 *
 * The bar uses the SHORT label: «گزارش درآمد» wraps to two lines across six
 * items on a phone and the second line falls outside the bar entirely.
 */
export const Mobile: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The short label is present…
    await expect(await canvas.findByText(/^گزارش$|^Report$/)).toBeInTheDocument()
    // …and the full one is nowhere on screen, because the rail is not rendered.
    await expect(canvas.queryByText(/^گزارش درآمد$|^Income report$/)).not.toBeInTheDocument()
    // No permanent rail either — its paper is what reserves the 264px gutter.
    await expect(permanentRail(canvasElement)).toBeNull()
  },
}

/**
 * The drawer is the phone's route to the full labels. It is closed on load —
 * a drawer that opened itself would cover the page on every visit — and the
 * hamburger is the only thing that opens it.
 */
export const MobileDrawerOpens: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(await canvas.findByRole('button', { name: /^باز کردن منو$|^Open menu$/ }))

    // The temporary drawer is portalled out of the story canvas, and the bottom
    // bar repeats four of the same labels — so the assertions are scoped to the
    // drawer rather than to the document.
    const drawer = await waitFor(() => {
      const element = canvasElement.ownerDocument.querySelector<HTMLElement>('.MuiDrawer-modal')
      if (!element) {
        throw new Error('drawer not open')
      }
      return element
    })
    const inDrawer = within(drawer)

    await expect(await inDrawer.findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()
    await expect(await inDrawer.findByText(/^تنظیمات$|^Settings$/)).toBeInTheDocument()
  },
}

/**
 * English is longer than Persian everywhere, and the bottom bar is where that
 * bites: "Income report" across a sixth of a 320px phone. The short label has
 * to survive the locale switch too.
 */
export const MobileEnglish: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { locale: 'en-US', viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const short = await canvas.findByText('Report')
    await expect(short).toBeInTheDocument()
    // One line, not two: the bar is what the second line would fall out of.
    await expect(short.getBoundingClientRect().height).toBeLessThan(24)
  },
}

/**
 * The bottom bar is the phone's navigation, so pressing an item has to move the
 * app and the bar has to show where it moved to. A bar that navigates without
 * updating its own selection leaves the user unable to tell where they are.
 */
export const MobileBottomBarNavigates: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const ledger = (await canvas.findByText(/^دفتر درآمد$|^Income ledger$/)).closest('button')!
    const settings = (await canvas.findByText(/^تنظیمات$|^Settings$/)).closest('button')!

    await expect(ledger).toHaveClass('Mui-selected')

    await userEvent.click(settings)

    await waitFor(async () => expect(settings).toHaveClass('Mui-selected'))
    await expect(ledger).not.toHaveClass('Mui-selected')
  },
}

/** The rail does the same on desktop, and marks the page it is already on. */
export const DesktopRailNavigates: Story = {
  render: () => <Frame path="/ledger" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const ledger = (await canvas.findByText(/^دفتر درآمد$|^Income ledger$/)).closest('.MuiListItemButton-root')!
    const charts = (await canvas.findByText(/^نمودارها$|^Charts$/)).closest('.MuiListItemButton-root')!

    await expect(ledger).toHaveClass('Mui-selected')

    await userEvent.click(charts)

    await waitFor(async () => expect(charts).toHaveClass('Mui-selected'))
    await expect(ledger).not.toHaveClass('Mui-selected')
  },
}
