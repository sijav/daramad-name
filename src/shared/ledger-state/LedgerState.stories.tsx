import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from 'src/shared/surface-card'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
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

export const Empty: Story = { args: { kind: 'empty', onAction: fn() } }

export const NoResults: Story = { args: { kind: 'no-results', onAction: fn() } }

export const Error: Story = { args: { kind: 'error', onAction: fn() } }

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

export const WithoutAnAction: Story = {
  args: { kind: 'empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await canvas.findByText(/^هنوز دریافتی‌ای ثبت نکردی$|^You have not recorded any receipts yet$/)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const LoadingIsAnnounced: Story = {
  args: { kind: 'loading' },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull())
  },
}
