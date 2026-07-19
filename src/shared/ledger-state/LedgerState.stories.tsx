import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import { LedgerState } from './LedgerState'

const meta = {
  title: 'Shared/LedgerState',
  component: LedgerState,
  render: (args) => (
    <GlassCard>
      <LedgerState {...args} />
    </GlassCard>
  ),
} satisfies Meta<typeof LedgerState>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { kind: 'loading' } }

/** "You have not recorded anything" — sends the user to quick entry. */
export const Empty: Story = { args: { kind: 'empty', onAction: () => {} } }

/** "Your filter matched nothing" — a different situation needing the opposite action, so it clears filters instead. */
export const NoResults: Story = { args: { kind: 'no-results', onAction: () => {} } }

export const Error: Story = { args: { kind: 'error', onAction: () => {} } }
