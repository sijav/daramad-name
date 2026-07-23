import { useLingui } from '@lingui/react/macro'
import { Button, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ChartCard, type ChartCardProps } from './ChartCard'

const meta = {
  title: 'Shared/ChartCard',
  component: ChartCard,
  argTypes: { variant: { control: 'inline-radio', options: ['chart', 'content'] } },
} satisfies Meta<typeof ChartCard>
export default meta
type Story = StoryObj<typeof meta>

/**
 * The panel the design puts a chart on: solid `surface-default` with a 1px
 * `border-default` hairline, in one of two treatments. `chart` is the Charts
 * page's componentised panel — 16px, no shadow. `content` is the dashboard's —
 * 20px with Elevation/1. The Figma file draws the same panel both ways
 * depending on the screen, so the variant follows the call site.
 *
 * Both are flat. The redesign moved chart panels off the frosted 28px card
 * (`SurfaceCard`'s old `GlassCard` form, gone from the app entirely), because a
 * blurred translucent backdrop behind a data visualisation costs contrast
 * exactly where it matters most.
 */
const View = ({ subtitle, variant, action }: { subtitle?: boolean } & Pick<ChartCardProps, 'variant' | 'action'>) => {
  const { t } = useLingui()
  return (
    <div style={{ maxWidth: 544 }}>
      <ChartCard
        title={t`Top clients`}
        subtitle={subtitle ? t`Based on the income recorded this year` : undefined}
        variant={variant}
        action={action}
      >
        <Typography sx={{ color: 'text.secondary' }} variant="body2">
          {t`Nothing recorded in this range yet.`}
        </Typography>
      </ChartCard>
    </div>
  )
}

const base = { title: '', children: null }

/**
 * The heading is pinned to `h3` in BOTH variants — the variant only picks the
 * SIZE the design draws it at. Asserted because the `chart` variant's `h5`
 * typography once emitted an actual `<h5>` under the page's `<h2>`, skipping
 * two levels, and the a11y addon's heading-order rule cannot see it in a canvas
 * holding a single card.
 */
const headingIsLevelThree: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await expect(await canvas.findByRole('heading', { level: 3, name: /^مشتری‌های برتر$|^Top clients$/ })).toBeInTheDocument()
}

export const TitleOnly: Story = {
  args: { ...base, variant: 'chart' },
  render: (args) => <View variant={args.variant} />,
  play: headingIsLevelThree,
}

export const WithSubtitle: Story = {
  args: { ...base, variant: 'chart' },
  render: (args) => <View subtitle variant={args.variant} />,
}

/** The dashboard's treatment: 20px and Elevation/1, for a panel among cards rather than among charts. */
export const Content: Story = {
  args: { ...base, variant: 'content' },
  render: (args) => <View subtitle variant={args.variant} />,
  play: headingIsLevelThree,
}

/**
 * The `action` slot: a control aligned opposite the title, which on the
 * dashboard is «مشاهده همه» out of the latest-receipts panel. It sits in the
 * title row, so a long English title has to wrap around it rather than push it
 * off the card.
 */
export const WithAction: Story = {
  args: { ...base, variant: 'content' },
  render: (args) => <View variant={args.variant} action={<ViewAll />} />,
}

const ViewAll = () => {
  const { t } = useLingui()
  return (
    <Button size="small" variant="text">
      {t`View all`}
    </Button>
  )
}
