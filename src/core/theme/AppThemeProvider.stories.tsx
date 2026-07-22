import { Box, Button, Chip, Stack, Table, TableBody, TableCell, TableRow, useTheme } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { AppThemeProvider } from './AppThemeProvider'

// `AppThemeProvider` is the only thing standing between a settings row and what
// the user actually sees: it resolves the colour mode, picks the Emotion cache
// that mirrors the whole layout, and hands MUI a direction. Every one of those
// fails silently — the app still renders, just in the wrong scheme or mirrored
// the wrong way.
//
// These stories render a probe INSIDE a second provider so the assertions are
// about the provider under test rather than Storybook's toolbar.

const Probe = () => {
  const theme = useTheme()

  return (
    <div>
      <span data-testid="mode">{theme.palette.mode}</span>
      <span data-testid="direction">{theme.direction}</span>

      {/* Authored as a physical left margin. In RTL the stylis plugin must
          rewrite it to the right — that rewrite is what lets every component
          in the app be written once for LTR. */}
      <Box data-testid="logical-inset" sx={{ marginLeft: '40px', width: 24, height: 24, border: '1px solid' }} />

      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Button data-testid="filled" variant="contained">
          Filled
        </Button>
        <Chip data-testid="chip" color="primary" label="Chip" />
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
  args: { locale: 'fa-IR', themePreference: 'light', children: <Probe /> },
} satisfies Meta<typeof AppThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

const styleOf = (element: Element) => element.ownerDocument.defaultView!.getComputedStyle(element)

/**
 * A pinned `light` preference stays light, and the document carries it.
 *
 * `dir`, `lang` and `color-scheme` live on `<html>` because screen readers,
 * native form controls and the scrollbar read them from there and from nowhere
 * else — the MUI theme is invisible to all three.
 */
export const Light: Story = {
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

/**
 * A pinned `dark` preference must swap the actual palette, not just the flag.
 *
 * Asserting on a painted colour rather than on `palette.mode` is deliberate:
 * three components once hardcoded hex and kept their light values here while
 * `mode` reported dark quite happily.
 */
export const Dark: Story = {
  args: { themePreference: 'dark' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('mode')).toHaveTextContent('dark')
    // The dark brand blue #8fb0ff — lightened so a filled button is legible on
    // a near-black surface.
    await expect(styleOf(await canvas.findByTestId('filled')).backgroundColor).toBe('rgb(143, 176, 255)')
  },
}

/**
 * `system` follows the OS. A flipped ternary here would look correct to anyone
 * whose machine matches the default, which is why the expectation is computed
 * from the media query rather than written down.
 */
export const System: Story = {
  args: { themePreference: 'system' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    const expected = view.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    await expect(await canvas.findByTestId('mode')).toHaveTextContent(expected)
  },
}

/**
 * Persian mirrors the layout through Emotion, not through component code.
 *
 * If the stylis plugin is not wired — or `stylis` drifts off the 4.2.0 the
 * cache bundles — nothing throws: the CSS simply stops being flipped and every
 * inset in the app lands on the wrong side.
 */
export const PersianMirrorsTheLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('direction')).toHaveTextContent('rtl')

    const inset = styleOf(await canvas.findByTestId('logical-inset'))
    await expect(inset.marginRight).toBe('40px')
    await expect(inset.marginLeft).toBe('0px')
  },
}

/** English keeps the same rule authored physically, so nothing is flipped. */
export const EnglishKeepsTheLayout: Story = {
  args: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(await canvas.findByTestId('direction')).toHaveTextContent('ltr')

    const inset = styleOf(await canvas.findByTestId('logical-inset'))
    await expect(inset.marginLeft).toBe('40px')
    await expect(inset.marginRight).toBe('0px')
  },
}

/**
 * A column of money reads right-aligned in BOTH directions.
 *
 * `align="right"` emits `text-align: right`, which the RTL plugin dutifully
 * mirrors to the left — so the theme counter-flips and authors `left` under
 * RTL. Get either half wrong and the figures land on the wrong edge in exactly
 * one language.
 */
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

/**
 * The two blues, as painted.
 *
 * #3460d6 fills a button, #3b6ef5 fills a chip. They are one step apart, so
 * merging them onto `primary.main` is invisible in review and obvious beside
 * the design.
 */
export const TheTwoBluesArePainted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(styleOf(await canvas.findByTestId('filled')).backgroundColor).toBe('rgb(52, 96, 214)')
    await expect(styleOf(await canvas.findByTestId('chip')).backgroundColor).toBe('rgb(59, 110, 245)')
  },
}
