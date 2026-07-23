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
    flat: { control: 'boolean' },
    disablePadding: {
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

export const Default: Story = { args: { children: body, sx: { maxWidth: 520 } } }

export const Supporting: Story = { args: { ...Default.args, radius: 'lg' } }

export const Flat: Story = { args: { ...Default.args, flat: true } }

export const Subtle: Story = { args: { ...Default.args, tone: 'subtle', flat: true } }

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
