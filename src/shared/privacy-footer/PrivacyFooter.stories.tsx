import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrivacyFooter } from './PrivacyFooter'

const meta = {
  title: 'Shared/PrivacyFooter',
  component: PrivacyFooter,
} satisfies Meta<typeof PrivacyFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
