import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageHeader } from './PageHeader'

const meta = {
  title: 'Shared/PageHeader',
  component: PageHeader,
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = { args: { title: 'Settings' } }

export const WithSubtitle: Story = {
  args: { title: 'Income ledger', subtitle: 'Every receipt you have, with an exact total' },
}

/** The action slot holds the year picker on the charts and report pages. */
export const WithAction: Story = {
  args: {
    title: 'Charts',
    subtitle: 'A one-year picture of your income',
    action: <Button variant="outlined">1405</Button>,
  },
}
