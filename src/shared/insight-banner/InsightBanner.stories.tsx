import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { InsightBanner } from './InsightBanner'

const meta = {
  title: 'Shared/InsightBanner',
  component: InsightBanner,
} satisfies Meta<typeof InsightBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Fires above 50%. Scenario 4's «۷۰٪» is one instance of that rule, not a second threshold. */
export const ClientConcentration: Story = {
  args: {
    message: '73.2% of your income comes from one client (“Aria Trading”). If they leave, a large part of your income goes with them.',
  },
}

/**
 * The severity is `warning`, not `error`. Depending on one client is a business
 * risk worth naming, not a mistake the user made — an error-red banner on the
 * charts page reads as "you did something wrong", which is the wrong voice and
 * the wrong information.
 */
export const IsAWarningNotAnError: Story = {
  args: { message: '73.2% of your income comes from one client (“Aria Trading”).' },
  play: async ({ canvasElement }) => {
    const banner = await within(canvasElement).findByRole('alert')

    await expect(banner).toHaveClass('MuiAlert-colorWarning')
    await expect(banner).not.toHaveClass('MuiAlert-colorError')
  },
}

/**
 * A caller's `sx` has to win. The banner merges its own styles as an ARRAY —
 * spreading them into one object instead would silently drop whatever the page
 * passed, which is how a panel ends up ignoring the spacing it was given.
 */
export const CallerStylesWin: Story = {
  args: {
    message: '73.2% of your income comes from one client (“Aria Trading”).',
    sx: { marginTop: '24px' },
  },
  play: async ({ canvasElement }) => {
    const banner = await within(canvasElement).findByRole('alert')

    await expect(window.getComputedStyle(banner).marginTop).toBe('24px')
  },
}
