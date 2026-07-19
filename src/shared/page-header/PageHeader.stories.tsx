import { useLingui } from '@lingui/react/macro'
import { Button } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFormat } from 'src/shared/format'
import { PageHeader } from './PageHeader'

const meta = { title: 'Shared/PageHeader', component: PageHeader } satisfies Meta<typeof PageHeader>
export default meta
type Story = StoryObj<typeof meta>

const TitleOnlyView = () => {
  const { t } = useLingui()
  return <PageHeader title={t`Settings`} />
}

const SubtitleView = () => {
  const { t } = useLingui()
  return <PageHeader title={t`Income ledger`} subtitle={t`Every receipt you have, with an exact total`} />
}

const ActionView = () => {
  const { t } = useLingui()
  const { digits } = useFormat()
  return (
    <PageHeader
      title={t`Charts`}
      subtitle={t`A one-year picture of your income`}
      action={<Button variant="outlined">{digits(1405)}</Button>}
    />
  )
}

const base = { title: '' }

export const TitleOnly: Story = { args: base, render: () => <TitleOnlyView /> }
export const WithSubtitle: Story = { args: base, render: () => <SubtitleView /> }

/** The action slot holds the year picker on the charts and report pages. */
export const WithAction: Story = { args: base, render: () => <ActionView /> }
