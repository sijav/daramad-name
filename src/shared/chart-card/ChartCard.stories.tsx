import { useLingui } from '@lingui/react/macro'
import { Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartCard } from './ChartCard'

const meta = { title: 'Shared/ChartCard', component: ChartCard } satisfies Meta<typeof ChartCard>
export default meta
type Story = StoryObj<typeof meta>

/**
 * The surface the design uses for charts: 16px radius, solid `surface-default`,
 * a 1px `border-default` hairline — deliberately NOT the 28px frosted
 * `GlassCard`. A blurred translucent backdrop behind a data visualisation costs
 * contrast exactly where it matters most.
 */
const View = ({ subtitle }: { subtitle?: boolean }) => {
  const { t } = useLingui()
  return (
    <div style={{ maxWidth: 544 }}>
      <ChartCard title={t`Top clients`} subtitle={subtitle ? t`Based on the income recorded this year` : undefined}>
        <Typography variant="body2" color="text.secondary">
          {t`Nothing recorded in this range yet.`}
        </Typography>
      </ChartCard>
    </div>
  )
}

const base = { title: '', children: null }

export const TitleOnly: Story = { args: base, render: () => <View /> }
export const WithSubtitle: Story = { args: base, render: () => <View subtitle /> }
