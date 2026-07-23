import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SurfaceCard } from './SurfaceCard'

const meta = {
  title: 'Shared/SurfaceCard',
  component: SurfaceCard,
  argTypes: {
    radius: {
      description:
        "`xl` (20px) for a screen's primary panel, `lg` (16px) for supporting ones.\nThe design draws this distinction on every screen — the Quick Entry form is\n20 while the three panels beside it are 16.",
      control: 'inline-radio',
      options: ['lg', 'xl'],
    },
    tone: {
      description: "`subtle` is the `brand-primary-subtle` tint the design uses for callouts and\nthe dashboard's report shortcut.",
      control: 'inline-radio',
      options: ['default', 'subtle'],
    },
    flat: { description: 'Drops the Elevation/1 shadow. The design omits it on Ledger, Report and Settings.', control: 'boolean' },
    disablePadding: {
      description:
        'Removes the padding for cards whose child paints edge to edge — the ledger\ntable, whose header band has to reach the rounded corners.\n\nA prop rather than `sx={{ p: 0 }}`: the default padding is responsive, so a\nscalar override loses to its own `@media` rule and the padding stays.',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof SurfaceCard>

export default meta
type Story = StoryObj<typeof meta>

const body = (
  <Stack spacing={1}>
    <Typography variant="h3">Record a receipt</Typography>
    <Typography sx={{ color: 'text.secondary' }} variant="body2">
      Log it in under 15 seconds
    </Typography>
  </Stack>
)

/** The design's panel: `surface-default`, a 1px hairline, 20px, Elevation/1. */
export const Default: Story = { args: { children: body, sx: { maxWidth: 520 } } }

/** `radius="lg"` is the 16px supporting panel — Settings, Report, Quick Entry's aside. */
export const Supporting: Story = { args: { ...Default.args, radius: 'lg' } }

/** `flat` drops the shadow. Ledger, Report and Settings panels carry none. */
export const Flat: Story = { args: { ...Default.args, flat: true } }

/** `tone="subtle"` is the tinted panel behind the dashboard's report shortcut. */
export const Subtle: Story = { args: { ...Default.args, tone: 'subtle', flat: true } }

/**
 * `disablePadding` is how the ledger table reaches the rounded corners, and it
 * is a PROP rather than `sx={{ p: 0 }}` for a reason worth seeing: the default
 * padding is responsive, so a scalar override loses to its own `@media` rule
 * and the header band stops short of the corner at every breakpoint.
 */
export const EdgeToEdge: Story = {
  args: {
    ...Default.args,
    disablePadding: true,
    flat: true,
    sx: { maxWidth: 520 },
    children: (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Client</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>1404/05/08</TableCell>
            <TableCell>Aria Trading</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>1404/05/21</TableCell>
            <TableCell>Naghsh Studio</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
}
