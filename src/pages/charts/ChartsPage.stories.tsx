import type { Meta, StoryObj } from '@storybook/react-vite'
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
