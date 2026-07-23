import { useLingui } from '@lingui/react/macro'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, fn, userEvent, within } from 'storybook/test'
import { EmptyState, type EmptyStateProps } from './EmptyState'

type ActionProps = Pick<EmptyStateProps, 'onAction'>

const FirstRunView = ({ onAction }: ActionProps) => {
  const { t } = useLingui()
  return (
    <SurfaceCard>
      <EmptyState
        icon={<ReceiptLongRoundedIcon />}
        title={t`You have not recorded any receipts yet`}
        description={t`The ledger is where every payment you have received adds up in one place — exactly what you need when it is time to produce a report.`}
        actionLabel={t`Record your first receipt`}
        onAction={onAction}
      />
    </SurfaceCard>
  )
}

const NoMatchView = ({ onAction }: ActionProps) => {
  const { t } = useLingui()
  return (
    <SurfaceCard>
      <EmptyState
        icon={<SearchOffRoundedIcon />}
        title={t`Nothing matched these filters`}
        description={t`Change the date range or client, or clear the filters to see every receipt.`}
        actionLabel={t`Clear filters`}
        onAction={onAction}
      />
    </SurfaceCard>
  )
}

const MessageOnlyView = () => {
  const { t } = useLingui()
  return (
    <SurfaceCard>
      <EmptyState
        title={t`No receipts recorded for this year`}
        description={t`The income report is built from the receipts you record. Add a few receipts first, then produce the document here.`}
      />
    </SurfaceCard>
  )
}

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  // Each story is a whole view — its own card and its own catalog copy — so the
  // Controls panel would be editing props that never reach the screen. Better
  // an empty panel than one that lies.
  parameters: { controls: { disable: true } },
  args: { title: '', description: '', onAction: fn() },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** Rule 6: never a dead blank screen — say why the page matters, offer the first action. */
export const FirstRun: Story = {
  render: (args) => <FirstRunView onAction={args.onAction} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // It stands in for the panel's content, so it carries the heading a section
    // title would — a screen reader jumping by heading must not skip past it.
    await expect(await canvas.findByRole('heading', { level: 3 })).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('button', { name: /^ثبت اولین دریافتی$|^Record your first receipt$/ }))
    await expect(args.onAction).toHaveBeenCalledTimes(1)
  },
}

/** A filtered-to-empty ledger is a different situation and gets different words. */
export const NoFilterMatches: Story = { render: (args) => <NoMatchView onAction={args.onAction} /> }

/**
 * Both decorations are optional, and the report page proves it: until a receipt
 * exists there is nothing to press, and offering a dead button would be worse
 * than offering none. The block still has to read as content — heading,
 * sentence, centred — rather than as a component that failed to render.
 */
export const MessageOnly: Story = {
  render: () => <MessageOnlyView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 3 })).toBeInTheDocument()
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}
