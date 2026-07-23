import { useLingui } from '@lingui/react/macro'
import { Button, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ChartCard, type ChartCardProps } from './ChartCard'

const meta = {
  title: 'Shared/ChartCard',
  component: ChartCard,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['chart', 'content'],
    },
    // Slots the render fills with nodes, so no control can drive them.
    action: { control: false },
    children: { control: false },
  },
  // `View` passes its own JSX children, which win over the spread, so this only satisfies the required prop.
  args: { title: '', subtitle: '', variant: 'chart', children: null },
} satisfies Meta<typeof ChartCard>
export default meta
type Story = StoryObj<typeof meta>

/**
 * Sample copy comes from the catalog so the Language toolbar switches it, and a blank arg falls back to it. `withSubtitle` is a
 * separate flag because blank already means "use the sample", so it cannot also mean "no subtitle".
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

const ViewAll = () => {
  const { t } = useLingui()
  return (
    <Button size="small" variant="text">
      {t`View all`}
    </Button>
  )
}

// `variant` picks the title's size, not its level. The `chart` variant draws it with `h5` typography and once emitted a literal
// `<h5>` under the page's `<h2>`, skipping two levels; axe's heading-order rule cannot catch that in a canvas holding one heading.
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
