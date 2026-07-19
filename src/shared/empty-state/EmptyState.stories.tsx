import { useLingui } from '@lingui/react/macro'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { GlassCard } from 'src/shared/glass-card'
import { EmptyState } from './EmptyState'

const meta = { title: 'Shared/EmptyState', component: EmptyState } satisfies Meta<typeof EmptyState>
export default meta
type Story = StoryObj<typeof meta>

const FirstRunView = () => {
  const { t } = useLingui()
  return (
    <GlassCard>
      <EmptyState
        icon={<ReceiptLongRoundedIcon />}
        title={t`You have not recorded any receipts yet`}
        description={t`The ledger is where every payment you have received adds up in one place — exactly what you need when it is time to produce a report.`}
        actionLabel={t`Record your first receipt`}
        onAction={() => {}}
      />
    </GlassCard>
  )
}

const NoMatchView = () => {
  const { t } = useLingui()
  return (
    <GlassCard>
      <EmptyState
        icon={<SearchOffRoundedIcon />}
        title={t`Nothing matched these filters`}
        description={t`Change the date range or client, or clear the filters to see every receipt.`}
        actionLabel={t`Clear filters`}
        onAction={() => {}}
      />
    </GlassCard>
  )
}

const base = { title: '', description: '' }

/** Rule 6: never a dead blank screen — say why the page matters, offer the first action. */
export const FirstRun: Story = { args: base, render: () => <FirstRunView /> }

/** A filtered-to-empty ledger is a different situation and gets different words. */
export const NoFilterMatches: Story = { args: base, render: () => <NoMatchView /> }
