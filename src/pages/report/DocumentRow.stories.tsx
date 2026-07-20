import { Stack } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DocumentRow } from './DocumentRow'

const meta = { title: 'Report/DocumentRow', component: DocumentRow } satisfies Meta<typeof DocumentRow>
export default meta
type Story = StoryObj<typeof meta>

/** The certificate's header lines: label on the reading edge, value opposite. */
export const Default: Story = {
  args: { label: 'نام', value: 'رها محمدی' },
  render: (args) => (
    <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
      <DocumentRow {...args} />
      <DocumentRow label="بازه" value="۱ فروردین تا ۲۹ اسفند ۱۴۰۳" />
      <DocumentRow label="تاریخ صدور" value="۲۲ مرداد ۱۴۰۴" />
    </Stack>
  ),
}
