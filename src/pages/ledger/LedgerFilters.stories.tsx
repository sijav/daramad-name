import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GlassCard } from 'src/shared/glass-card'
import type { LedgerFilter } from 'src/shared/types'
import { LedgerFilters } from './LedgerFilters'

const meta = {
  title: 'Pages/Ledger/LedgerFilters',
  component: LedgerFilters,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LedgerFilters>

export default meta
type Story = StoryObj<typeof meta>

const Controlled: Story['render'] = function Render(args) {
  const [filter, setFilter] = useState<LedgerFilter>(args.filter)
  return (
    <GlassCard>
      <LedgerFilters filter={filter} onFilterChange={setFilter} />
    </GlassCard>
  )
}

/** No filters applied — "clear filters" is disabled. */
export const Empty: Story = {
  args: { filter: {}, onFilterChange: () => {} },
  render: Controlled,
}

/** Scenario 2: narrowed to one channel, so "clear filters" becomes available. */
export const Filtered: Story = {
  args: { filter: { channel: 'TETHER' }, onFilterChange: () => {} },
  render: Controlled,
}
