import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ChartsPage } from './ChartsPage'

const meta = {
  title: 'Pages/Charts',
  component: ChartsPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/charts' } },
} satisfies Meta<typeof ChartsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Scenario 4: the year bar chart, the donut with its insight, and the ranked client list. */
export const WithData: Story = {}

/** A year with nothing recorded — the empty state rather than twelve zero bars. */
export const Empty: Story = { parameters: { page: { data: 'empty', route: '/charts' } } }

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
