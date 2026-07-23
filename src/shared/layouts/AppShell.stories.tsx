import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PageHeader } from 'src/shared/page-header'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AppShell } from './AppShell'

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const Frame = ({ path }: { path: string }) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route element={<AppShell />}>
        {/* A real destination for the top bar's account button, which is the
            only control in the shell that navigates outside the two navs. */}
        <Route path="/settings" element={<h1>the settings page</h1>} />
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

export const Desktop: Story = {
  render: () => <Frame path="/ledger" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The rail is here and carries the FULL label, which is what the design draws.
    await expect(await canvas.findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()

    // And it is a landmark. A screen-reader user has no other way to jump to
    // the navigation, or past it to the page — the six links otherwise sit in
    // the tree as a bare list with nothing saying what they are.
    await expect(await canvas.findByRole('navigation')).toBeInTheDocument()

    // …and none of the phone chrome is. A hamburger beside a permanent rail is
    // two ways to reach the same six links.
    await expect(canvas.queryByRole('button', { name: /^باز کردن منو$|^Open menu$/ })).not.toBeInTheDocument()
    await expect(canvas.queryByText(/^گزارش$|^Report$/)).not.toBeInTheDocument()
  },
}

export const DesktopDark: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()
  },
}

export const TopBarControls: Story = {
  render: () => <Frame path="/ledger" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the theme toggle is reachable by name', async () => {
      await expect(await canvas.findByRole('button', { name: /^تغییر تم$|^Switch theme$/ })).toBeInTheDocument()
    })

    await step('and the account button goes to Settings', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /^مشخصات فردی$|^Your details$/ }))
      await expect(await canvas.findByRole('heading', { name: 'the settings page' })).toBeInTheDocument()
    })
  },
}

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

export const Tablet: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'tablet', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^گزارش درآمد$|^Income report$/)).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /^باز کردن منو$|^Open menu$/ })).not.toBeInTheDocument()
  },
}

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

    // The bar IS the navigation on a phone, so it is the landmark here — the
    // rail's is not in the document at this width.
    await expect(await canvas.findByRole('navigation')).toBeInTheDocument()
  },
}

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

    // The drawer carries the landmark with it. While it is open MUI's Modal
    // aria-hides the rest of the document, including the bottom bar, so this
    // nav is the only navigation exposed — and it has to exist, or the phone's
    // full-label navigation is unreachable by landmark.
    await expect(await inDrawer.findByRole('navigation')).toBeInTheDocument()
  },
}

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
