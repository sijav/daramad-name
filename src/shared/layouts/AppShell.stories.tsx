import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { GlassCard } from 'src/shared/glass-card'
import { PageHeader } from 'src/shared/page-header'
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
              <PageHeader title="دفتر درآمد" subtitle="همه‌ی دریافتی‌هایت، با جمع دقیق" />
              <GlassCard sx={{ minHeight: 240 }}>محتوای صفحه</GlassCard>
            </>
          }
        />
      </Route>
    </Routes>
  </MemoryRouter>
)

/** Desktop: a permanent nav rail on the right, since the layout is RTL. */
export const Desktop: Story = { render: () => <Frame path="/ledger" /> }

/**
 * Mobile gets a thumb-reachable bottom bar rather than only a drawer — rule 1
 * says half the demo-link traffic arrives on a phone.
 */
export const Mobile: Story = {
  render: () => <Frame path="/ledger" />,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
