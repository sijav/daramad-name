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
    title: { control: 'text', description: 'The panel heading. Left blank, each story falls back to its translated sample.' },
    subtitle: { control: 'text', description: 'A line under the title saying what the figures cover.' },
    variant: {
      control: 'inline-radio',
      options: ['chart', 'content'],
      description: '`chart` is the Charts page treatment — 16px, no shadow. `content` is the dashboard’s — 20px with Elevation/1.',
    },
    action: { control: false, description: 'A control aligned opposite the title, such as a link to the full page.' },
    children: { control: false, description: 'The chart, or whatever the panel is wrapping.' },
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

/** The Charts page treatment: a heading and the panel, nothing else. */
export const TitleOnly: Story = {
  render: (args) => <View {...args} />,
  play: headingIsLevelThree,
}

/** The second line, for a panel whose figures need their range stated. */
export const WithSubtitle: Story = {
  render: (args) => <View withSubtitle {...args} />,
}

/** The dashboard's treatment: 20px and Elevation/1, for a panel among cards rather than among charts. */
export const Content: Story = {
  args: { variant: 'content' },
  render: (args) => <View withSubtitle {...args} />,
  play: headingIsLevelThree,
}

/**
 * The `action` slot: a control aligned opposite the title, which on the
 * dashboard is «مشاهده همه» out of the latest-receipts panel. It sits in the
 * title row, so a long English title has to wrap around it rather than push it
 * off the card.
 */
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
