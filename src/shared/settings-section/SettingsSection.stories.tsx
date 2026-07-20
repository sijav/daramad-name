import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingButton } from './SettingButton'
import { SettingRow } from './SettingRow'
import { SettingsSection } from './SettingsSection'

const meta = {
  title: 'Shared/SettingsSection',
  component: SettingsSection,
} satisfies Meta<typeof SettingsSection>

export default meta
type Story = StoryObj<typeof meta>

/** The design's data section, row for row — including the destructive tone. */
export const DataAndBackup: Story = {
  args: {
    title: 'داده‌ها و پشتیبان‌گیری',
    children: (
      <>
        <SettingRow label="بکاپ داده‌ها" description="یک فایل JSON از همه‌ی دریافتی‌ها دانلود کن">
          <SettingButton tone="primary">دانلود بکاپ</SettingButton>
        </SettingRow>
        <SettingRow label="بازیابی" description="فایل بکاپ را وارد کن تا دفترت برگردد">
          <SettingButton>انتخاب فایل</SettingButton>
        </SettingRow>
        <SettingRow label="پاک کردن همه" description="همه‌ی داده‌ها برای همیشه حذف می‌شود">
          <SettingButton tone="danger">پاک کردن همه</SettingButton>
        </SettingRow>
      </>
    ),
  },
}

/** A statement-only section, like the design's privacy block. */
export const StatementOnly: Story = {
  args: {
    title: 'حریم خصوصی',
    children: <SettingRow label="همه‌ی داده‌ها فقط روی مرورگر خودت می‌مونه و هیچ‌جا ارسال نمی‌شه." />,
  },
}
