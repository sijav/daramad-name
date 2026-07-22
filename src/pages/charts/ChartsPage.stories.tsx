import type { Meta, StoryObj } from '@storybook/react-vite'
import { Route, Routes } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { ChartsPage } from './ChartsPage'

// `role-img-alt` is switched off HERE ONLY, and it is upstream rather than ours.
//
// MUI X renders `ChartsAccessibilityProxy`: two `role="img"` divs pointing at
// `voiceover-<chartId>-1|2` elements that the library creates EMPTY and fills
// only while the chart has keyboard focus. It is a live-region proxy for
// keyboard navigation, not a static image label — so at rest axe correctly sees
// `role="img"` with an empty name, on every chart, in every story.
//
// The only ways to satisfy the rule are to pass `disableKeyboardNavigation`,
// which removes a real accessibility feature to please a checker, or to write
// into MUI X's internal divs. Both are worse than the finding. Every other axe
// rule stays enforced. SEE TECH-DEBT.md.
const CHART_A11Y = { a11y: { config: { rules: [{ id: 'role-img-alt', enabled: false }] } } }

const meta = {
  title: 'Pages/Charts',
  component: ChartsPage,
  parameters: { ...CHART_A11Y, layout: 'fullscreen', page: { data: 'full', route: '/charts' } },
} satisfies Meta<typeof ChartsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Scenario 4: the year bar chart, the donut with its insight, and the ranked client list. */
export const WithData: Story = {}

/**
 * A year with nothing recorded — the empty state rather than twelve zero bars.
 *
 * The distinction is the point. `ShowsTheWholeYearAndTheRisk` proves a quiet
 * MONTH keeps its bar, because dropping it would make a patchy year look
 * continuous. A quiet YEAR is a different thing: twelve empty bars and a donut
 * with no slices read as a broken page, and the one useful thing to say to
 * someone who has recorded nothing is how to record something.
 */
export const Empty: Story = {
  parameters: { page: { data: 'empty', route: '/charts' } },
  render: () => (
    <Routes>
      <Route path="/charts" element={<ChartsPage />} />
      <Route path="/quick-entry" element={<h1>the quick entry page</h1>} />
    </Routes>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^برای این سال هنوز داده‌ای نیست$|^No data for this year yet$/)).toBeInTheDocument()
    // No axis, no donut, no ranked list — nothing that would imply a chart is
    // being shown and simply happens to be flat.
    await expect(canvas.queryByText(/فروردین|Farvardin/)).toBeNull()
    await expect(canvas.queryByText(/^سهم مشتری‌ها از درآمد$|^Client share of income$/)).toBeNull()

    // Two buttons carry this label — the header's permanent action and the
    // empty state's own call to action. The empty state's is the later one.
    const actions = await canvas.findAllByRole('button', { name: /^ثبت دریافتی$|^Record a receipt$/ })
    await userEvent.click(actions[actions.length - 1])
    await expect(await canvas.findByRole('heading', { name: 'the quick entry page' })).toBeInTheDocument()
  },
}

/**
 * Scenario 4, asserted rather than eyeballed.
 *
 * The brief is explicit that a month with no income keeps a zero bar instead of
 * disappearing — a chart that silently drops empty months makes a patchy year
 * look continuous, which is the opposite of what this page is for. And the
 * concentration warning has to actually fire, because a freelancer usually
 * learns about that dependency only once the client has gone.
 */
export const ShowsTheWholeYearAndTheRisk: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // All twelve Jalali months are on the axis, including the quiet ones.
    const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    for (const month of MONTHS) {
      await expect(await canvas.findAllByText(new RegExp(month))).not.toHaveLength(0)
    }

    // The dependency warning is present and names a share.
    const insight = await canvas.findByText(/درآمدت از یک مشتری/)
    await expect(insight).toBeInTheDocument()
    await expect(insight.textContent).toMatch(/[۰-۹]+٪/)
  },
}
