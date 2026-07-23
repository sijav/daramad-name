import { useLingui } from '@lingui/react/macro'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { SettingButton } from './SettingButton'
import { SettingRow } from './SettingRow'
import { SettingsSection, type SettingsSectionProps } from './SettingsSection'

/**
 * The rows are composed per story, so the args that carry meaning are the row
 * handlers: a settings section exists to put controls in front of the user, and
 * a control that reports nowhere is the failure a story can actually catch.
 */
interface SectionArgs extends SettingsSectionProps {
  onBackUp: () => void
  onChooseFile: () => void
  onEraseAll: () => void
}

const meta = {
  title: 'Shared/SettingsSection',
  component: SettingsSection,
  argTypes: {
    title: { control: 'text' },
  },
  // `title` and `children` are both composed inside the render, the copy goes
  // through the catalog like the settings page's does, and `children` is a tree
  // no control can produce. An empty panel is honest; a panel describing args
  // that are not on screen is not.
  parameters: {
    controls: { disable: true },
  },
  args: { title: '', children: null, onBackUp: fn(), onChooseFile: fn(), onEraseAll: fn() },
} satisfies Meta<SectionArgs>

export default meta
// Typed from the story args rather than from `typeof meta`: the handlers below
// are not props of SettingsSection, and inferring from the component would drop
// them.
type Story = StoryObj<SectionArgs>

export const DataAndBackup: Story = {
  render: function Render(args) {
    const { t } = useLingui()
    return (
      <SettingsSection title={t`Data and backup`}>
        <SettingRow label={t`Back up data`} description={t`Download a JSON file of every receipt`}>
          <SettingButton tone="primary" onClick={args.onBackUp}>
            {t`Download backup`}
          </SettingButton>
        </SettingRow>
        <SettingRow label={t`Restore`} description={t`Import a backup file to bring your ledger back`}>
          <SettingButton onClick={args.onChooseFile}>{t`Choose file`}</SettingButton>
        </SettingRow>
        <SettingRow label={t`Erase everything`} description={t`All data is deleted permanently`}>
          <SettingButton tone="danger" onClick={args.onEraseAll}>
            {t`Erase all`}
          </SettingButton>
        </SettingRow>
      </SettingsSection>
    )
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // A section of the settings page, under that page's `h2`, the 16/600 the
    // design draws is a size, not a level.
    await expect(await canvas.findByRole('heading', { level: 3, name: /^داده‌ها و پشتیبان‌گیری$|^Data and backup$/ })).toBeInTheDocument()

    // The destructive row is the one worth pressing: it is the only control in
    // the app that can empty the ledger, and it has to report to its caller
    // rather than swallow the press.
    await userEvent.click(await canvas.findByRole('button', { name: /^پاک کردن همه$|^Erase all$/ }))
    await expect(args.onEraseAll).toHaveBeenCalledTimes(1)
  },
}

export const StatementOnly: Story = {
  render: function Render() {
    const { t } = useLingui()
    return (
      <SettingsSection title={t`Privacy`}>
        <SettingRow label={t`All your data stays in your own browser and is never sent anywhere.`} />
      </SettingsSection>
    )
  },
}
