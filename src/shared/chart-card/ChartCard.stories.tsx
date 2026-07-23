import { useLingui } from '@lingui/react/macro'
import { Button, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ChartCard, type ChartCardProps } from './ChartCard'

const meta = {
  title: 'Shared/ChartCard',
  component: ChartCard,
  // `ChartCard` forwards the rest of `PaperProps`, so docgen offers all of
  // MUI's surface props. These are the four the design actually varies.
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['chart', 'content'],
    },
    action: { control: false },
    children: { control: false },
  },
  // `children` is required by the props but supplied by `View`, whose JSX
  // children win over anything spread in — so this only satisfies the type.
  args: { title: '', subtitle: '', variant: 'chart', children: null },
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
/**
 * Sample copy comes from the catalog so the Language toolbar switches it, and a
 * per-field fallback lets anything typed into Controls override it.
 *
 * `withSubtitle` picks whether the story has a second line AT ALL — an empty
 * subtitle arg cannot express that, since blank is what "fall back to the
 * sample" means.
 */
const View = ({ withSubtitle, ...args }: { withSubtitle?: boolean } & ChartCardProps) => {
  const { t } = useLingui()
  return (
    <div style={{ maxWidth: 544 }}>
      <ChartCard
        {...args}
        title={args.title || t`Top clients`}
        subtitle={args.subtitle || (withSubtitle ? t`Based on the income recorded this year` : undefined)}
      >
        <Typography sx={{ color: 'text.secondary' }} variant="body2">
          {t`Nothing recorded in this range yet.`}
        </Typography>
      </ChartCard>
    </div>
  )
}

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
  render: (args) => <View {...args} />,
  play: headingIsLevelThree,
}

export const WithSubtitle: Story = {
  render: (args) => <View withSubtitle {...args} />,
}

export const Content: Story = {
  args: { variant: 'content' },
  render: (args) => <View withSubtitle {...args} />,
  play: headingIsLevelThree,
}

export const WithAction: Story = {
  args: { variant: 'content' },
  render: (args) => <View {...args} action={<ViewAll />} />,
}

const ViewAll = () => {
  const { t } = useLingui()
  return (
    <Button size="small" variant="text">
      {t`View all`}
    </Button>
  )
}
