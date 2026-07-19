import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingsPage } from './SettingsPage'

const meta = {
  title: 'Pages/Settings',
  component: SettingsPage,
  parameters: { layout: 'fullscreen', page: { data: 'full', route: '/settings' } },
} satisfies Meta<typeof SettingsPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Profile, language, appearance, calendar, backup/restore and the destructive
 * reset. The language and appearance controls here change the persisted
 * setting, which in the app is what the Storybook toolbars stand in for.
 */
export const Default: Story = {}
