import { Box, Button, Chip, Stack, Table, TableBody, TableCell, TableRow, useTheme } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { AppThemeProvider } from './AppThemeProvider'

const Probe = () => {
  const theme = useTheme()

  return (
    <div>
      <span data-testid="mode">{theme.palette.mode}</span>
      <span data-testid="direction">{theme.direction}</span>

      {/* Authored as a physical left margin. In RTL the stylis plugin must
          rewrite it to the right, that rewrite is what lets every component
          in the app be written once for LTR. */}
      <Box data-testid="logical-inset" sx={{ marginLeft: '40px', width: 24, height: 24, border: '1px solid' }} />

      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Button data-testid="filled" variant="contained">
          Filled
        </Button>
        <Button data-testid="outlined" variant="outlined">
          Outlined
        </Button>
        <Button data-testid="text" variant="text">
          Text
        </Button>
        {/* `color="primary"` is deliberately NOT used here. MUI's filled
            primary chip paints `contrastText` on `primary.main`, white on
            #3b6ef5, 4.44:1, and the app paints no such chip anywhere: this
            probe was the only one in the repo, and it was asserting a
            combination the product does not ship. `ChipSelect` and the nav rail
            use `primary` as the CONTAINER pair (`primary.light` behind
            `primary.dark`, 13.5:1) edged in `primary.main`, which is a border
            and so held to 3:1. The probe now paints exactly that, and still
            proves `primary.main` resolves to the chip blue. */}
        <Chip
          data-testid="chip"
          label="Chip"
          sx={{ backgroundColor: 'primary.light', color: 'primary.dark', border: '1px solid', borderColor: 'primary.main' }}
        />
      </Stack>

      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="figure" align="right">
              649,980,000
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

const meta = {
  title: 'Core/AppThemeProvider',
  component: AppThemeProvider,
  parameters: { layout: 'padded' },
  argTypes: {
    locale: {
      control: 'inline-radio',
      options: ['fa-IR', 'en-US'],
    },
    themePreference: {
      control: 'inline-radio',
      options: ['light', 'dark', 'system'],
    },
    children: {
      control: false,
      table: { disable: true },
    },
  },
  args: { locale: 'fa-IR', themePreference: 'light', children: <Probe /> },
} satisfies Meta<typeof AppThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

const styleOf = (element: Element) => element.ownerDocument.defaultView!.getComputedStyle(element)

export const Light: Story = {
  globals: { locale: 'fa-IR', theme: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('mode')).toHaveTextContent('light')

    const root = window.document.documentElement
    await waitFor(async () => {
      await expect(root.dir).toBe('rtl')
      await expect(root.lang).toBe('fa-IR')
      await expect(root.style.colorScheme).toBe('light')
    })
  },
}

export const Dark: Story = {
  args: { themePreference: 'dark' },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('mode')).toHaveTextContent('dark')
    // The dark brand blue #8fb0ff, lightened so a filled button is legible on
    // a near-black surface.
    await expect(styleOf(await canvas.findByTestId('filled')).backgroundColor).toBe('rgb(143, 176, 255)')

    // The other half of `Light`: native controls and the scrollbar follow
    // `color-scheme`, and nothing in the painted palette would reveal it stuck.
    await waitFor(async () => {
      await expect(window.document.documentElement.style.colorScheme).toBe('dark')
    })
  },
}

export const System: Story = {
  args: { themePreference: 'system' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    const expected = view.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    await expect(await canvas.findByTestId('mode')).toHaveTextContent(expected)
  },
}

export const PersianMirrorsTheLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('direction')).toHaveTextContent('rtl')

    const inset = styleOf(await canvas.findByTestId('logical-inset'))
    await expect(inset.marginRight).toBe('40px')
    await expect(inset.marginLeft).toBe('0px')
  },
}

export const EnglishKeepsTheLayout: Story = {
  args: { locale: 'en-US' },
  globals: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('direction')).toHaveTextContent('ltr')

    const inset = styleOf(await canvas.findByTestId('logical-inset'))
    await expect(inset.marginLeft).toBe('40px')
    await expect(inset.marginRight).toBe('0px')

    // `<html>` in the other direction too, the document contract `Light`
    // asserts for Persian, so neither half can be lost on its own.
    const root = window.document.documentElement
    await waitFor(async () => {
      await expect(root.dir).toBe('ltr')
      await expect(root.lang).toBe('en-US')
    })
  },
}

export const FiguresStayRightAlignedInPersian: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(styleOf(await canvas.findByTestId('figure')).textAlign).toBe('right')
  },
}

export const FiguresStayRightAlignedInEnglish: Story = {
  args: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(styleOf(await canvas.findByTestId('figure')).textAlign).toBe('right')
  },
}

export const TheTwoBluesArePainted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(styleOf(await canvas.findByTestId('filled')).backgroundColor).toBe('rgb(52, 96, 214)')
    await expect(styleOf(await canvas.findByTestId('chip')).borderTopColor).toBe('rgb(59, 110, 245)')
  },
}

export const EveryButtonInkIsTheBrandBlue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const id of ['outlined', 'text']) {
      await expect(styleOf(await canvas.findByTestId(id)).color).toBe('rgb(52, 96, 214)')
    }
  },
}
