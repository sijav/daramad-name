import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { LedgerState } from './LedgerState'

const meta = {
  title: 'Shared/LedgerState',
  component: LedgerState,
  argTypes: {
    kind: { description: 'Which of the four states to show. Each has its own wording and its own icon.' },
    onAction: { description: 'Retry for `error`, clear-filters for `no-results`, first-entry for `empty`.' },
    errorMessage: { description: 'The raw cause, shown under the `error` state so a glitch is distinguishable from real damage.' },
  },
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

/**
 * The two empty states must not read the same. "You have not recorded anything"
 * and "your filter matched nothing" want OPPOSITE next actions — one sends the
 * user to quick entry, the other clears the filters. Collapsing them tells a
 * user with a full ledger that they have never recorded a receipt.
 */
export const TheTwoEmptyStatesAreDifferent: Story = {
  args: { kind: 'empty', onAction: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^هنوز دریافتی‌ای ثبت نکردی$|^You have not recorded any receipts yet$/)).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: /^ثبت اولین دریافتی$|^Record your first receipt$/ })).toBeInTheDocument()
    // Not the filter wording, and not the filter action.
    await expect(canvas.queryByText(/فیلترها|filters/i)).not.toBeInTheDocument()
  },
}

export const NoResultsClearsFiltersInstead: Story = {
  args: { kind: 'no-results', onAction: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText(/^با این فیلترها چیزی پیدا نشد$|^Nothing matched these filters$/)).toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('button', { name: /^پاک کردن فیلترها$|^Clear filters$/ }))
    await expect(args.onAction).toHaveBeenCalledTimes(1)
  },
}

/**
 * A failure the user can act on has to say what failed. The default reassurance
 * is right when there is nothing more to say, but a real message from the data
 * layer — a quota error, a corrupt row — is what tells a glitch apart from data
 * loss, so it replaces the default rather than sitting beside it.
 */
export const ErrorShowsTheRealCause: Story = {
  args: { kind: 'error', onAction: fn(), errorMessage: 'A receipt in your data has an unreadable date.' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByText('A receipt in your data has an unreadable date.')).toBeInTheDocument()
    await expect(canvas.queryByText(/داده‌هایت سر جاشه|Your data is safe/)).not.toBeInTheDocument()

    await userEvent.click(await canvas.findByRole('button', { name: /^دوباره امتحان کن$|^Try again$/ }))
    await expect(args.onAction).toHaveBeenCalledTimes(1)
  },
}

/**
 * With no handler there is no button. An action that does nothing is worse than
 * an absent one — the user presses it, nothing happens, and they conclude the
 * app is broken rather than that the button was never wired.
 */
export const WithoutAnAction: Story = {
  args: { kind: 'empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByText(/^هنوز دریافتی‌ای ثبت نکردی$|^You have not recorded any receipts yet$/)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** Loading announces itself to a screen reader rather than only drawing skeletons. */
export const LoadingIsAnnounced: Story = {
  args: { kind: 'loading' },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull())
  },
}
