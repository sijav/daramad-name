import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import { fn } from 'storybook/test'
import { LedgerState } from './LedgerState'

const meta = {
  title: 'Shared/LedgerState',
  component: LedgerState,
  render: (args) => (
    <SurfaceCard>
      <LedgerState {...args} />
    </SurfaceCard>
  ),
} satisfies Meta<typeof LedgerState>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { kind: 'loading' } }

/** "You have not recorded anything" — sends the user to quick entry. */
export const Empty: Story = { args: { kind: 'empty', onAction: fn() } }

/** "Your filter matched nothing" — a different situation needing the opposite action, so it clears filters instead. */
export const NoResults: Story = { args: { kind: 'no-results', onAction: fn() } }

export const Error: Story = { args: { kind: 'error', onAction: fn() } }
