import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrivacyFooter } from './PrivacyFooter'

const meta = {
  title: 'Shared/PrivacyFooter',
  component: PrivacyFooter,
} satisfies Meta<typeof PrivacyFooter>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Rule 8 of the brief. The sentence is literally true — the app has no backend,
 * so nothing can be sent anywhere.
 */
export const Default: Story = {}
