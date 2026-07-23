import { useLingui } from '@lingui/react/macro'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, fn, userEvent, within } from 'storybook/test'
import { EmptyState } from './EmptyState'

// Each story spreads its args and then falls back per field. The copy is read
// from the catalog rather than written into `args`, so it follows the Language
// toolbar the way the app's does, but anything typed into Controls wins, which
// is what makes the panel real rather than decorative.
//
// The card around it is not the component's doing. An empty state always sits
// inside a panel, and floating on the canvas it reads as a component that
// failed to render rather than as a designed screen.

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  argTypes: {
    title: { control: 'text' },
    description: {
      control: 'text',
    },
    actionLabel: { control: 'text' },
    icon: { control: false },
  },
  args: { title: '', description: '', actionLabel: '', onAction: fn() },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const FirstRun: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <SurfaceCard>
        <EmptyState
          {...args}
          icon={<ReceiptLongRoundedIcon />}
          title={args.title || t`You have not recorded any receipts yet`}
          description={
            args.description ||
            t`The ledger is where every payment you have received adds up in one place, exactly what you need when it is time to produce a report.`
          }
          actionLabel={args.actionLabel || t`Record your first receipt`}
        />
      </SurfaceCard>
    )
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // It stands in for the panel's content, so it carries the heading a section
    // title would, a screen reader jumping by heading must not skip past it.
    await expect(await canvas.findByRole('heading', { level: 3 })).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('button', { name: /^ثبت اولین دریافتی$|^Record your first receipt$/ }))
    await expect(args.onAction).toHaveBeenCalledTimes(1)
  },
}

export const NoFilterMatches: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <SurfaceCard>
        <EmptyState
          {...args}
          icon={<SearchOffRoundedIcon />}
          title={args.title || t`Nothing matched these filters`}
          description={args.description || t`Change the date range or client, or clear the filters to see every receipt.`}
          actionLabel={args.actionLabel || t`Clear filters`}
        />
      </SurfaceCard>
    )
  },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: /^پاک کردن فیلترها$|^Clear filters$/ }))
    await expect(args.onAction).toHaveBeenCalledTimes(1)
  },
}

export const MessageOnly: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <SurfaceCard>
        <EmptyState
          {...args}
          title={args.title || t`No receipts recorded for this year`}
          description={
            args.description ||
            t`The income report is built from the receipts you record. Add a few receipts first, then produce the document here.`
          }
          actionLabel={args.actionLabel || undefined}
        />
      </SurfaceCard>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByRole('heading', { level: 3 })).toBeInTheDocument()
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}
