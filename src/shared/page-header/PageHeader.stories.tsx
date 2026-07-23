import { useLingui } from '@lingui/react/macro'
import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { PageHeader } from './PageHeader'

// Every story spreads its args and then falls back per field: `args.title ||
// t`Settings``.
//
// The sample copy is read from the catalog rather than written into `args`,
// which is what lets the Language toolbar switch it — but a reader who types
// into Controls has to win, or the panel is decoration. Falling back only on a
// blank gives both.

const meta = {
  title: 'Shared/PageHeader',
  component: PageHeader,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    meta: { control: 'text' },
    action: { control: false },
  },
  args: { title: '', subtitle: '', meta: '' },
} satisfies Meta<typeof PageHeader>
export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = {
  render: (args) => {
    const { t } = useLingui()
    return <PageHeader {...args} title={args.title || t`Settings`} />
  },
}

export const WithSubtitle: Story = {
  render: (args) => {
    const { t } = useLingui()
    return (
      <PageHeader
        {...args}
        title={args.title || t`Income ledger`}
        subtitle={args.subtitle || t`Every receipt you have, with an exact total`}
      />
    )
  },
}

export const WithMetaLine: Story = {
  render: (args) => {
    const { t } = useLingui()
    const { dateLong } = useFormat()
    const updated = dateLong(new Date(2025, 7, 13, 12).toISOString())
    return (
      <PageHeader
        {...args}
        title={args.title || t`Income report`}
        subtitle={args.subtitle || t`A presentable certificate, in Persian or English`}
        meta={args.meta || t`Last updated: ${updated}`}
      />
    )
  },
}

export const WithAction: Story = {
  render: (args) => {
    const { t } = useLingui()
    const { digits } = useFormat()
    return (
      <PageHeader
        {...args}
        title={args.title || t`Charts`}
        subtitle={args.subtitle || t`A one-year picture of your income`}
        action={args.action ?? <Button variant="outlined">{digits(1405)}</Button>}
      />
    )
  },
}
