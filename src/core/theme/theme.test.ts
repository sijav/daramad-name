import type { TypographyProps } from '@mui/material'
import { describe, expect, it } from 'vitest'
import { getTheme } from './theme'
import { darkColors, lightColors } from './tokens'

// A colour role that is missing, wrong or shared between the two blues does not
// throw, it paints. These assertions are what catches it.

const MODES = ['light', 'dark'] as const

/** The string roles `muiPalette.d.ts` adds. `chartSeries` is an array and is checked on its own. */
const EXTRA_ROLES = [
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'surfaceDefault',
  'outlineVariant',
  'outline',
  'glassSurface',
  'brandPrimary',
  'brandPrimaryHover',
  'brandPrimarySubtle',
  'textOnPrimary',
  'borderDefault',
  'borderStrong',
  'surfaceSubtle',
] as const

describe('getTheme — palette', () => {
  // An unwired role reaches CSS as `undefined`, which drops the declaration: no
  // error anywhere, the hairline is just gone.
  it('wires every extra MD3 role in both modes', () => {
    for (const mode of MODES) {
      const { palette } = getTheme(mode, 'rtl')
      for (const role of EXTRA_ROLES) {
        expect(palette[role], `${mode}.${role}`).toMatch(/^(#|rgba?\()/)
      }
      expect(palette.chartSeries.length, `${mode}.chartSeries`).toBeGreaterThanOrEqual(4)
    }
  })

  // The dark palette is derived by hand in `tokens.ts`, so the failure mode is
  // adding a light role and forgetting the dark one. Equal values put a light
  // colour on a near-black surface.
  it('gives every role a genuinely different value in dark mode', () => {
    const light = getTheme('light', 'rtl').palette
    const dark = getTheme('dark', 'rtl').palette

    for (const role of EXTRA_ROLES) {
      expect(dark[role], role).not.toBe(light[role])
    }
    expect(dark.background.default).not.toBe(light.background.default)
    expect(dark.background.paper).not.toBe(light.background.paper)
    expect(dark.text.primary).not.toBe(light.text.primary)
    expect(dark.text.secondary).not.toBe(light.text.secondary)
    expect(dark.divider).not.toBe(light.divider)
    expect(dark.chartSeries).not.toEqual(light.chartSeries)
  })

  // MUI's own components take their greys from `palette.mode`, not from our
  // roles: a Menu, a disabled input and an Alert all branch on it.
  it('reports its own mode', () => {
    expect(getTheme('light', 'rtl').palette.mode).toBe('light')
    expect(getTheme('dark', 'rtl').palette.mode).toBe('dark')
  })

  // The donut colours one client per entry, so two equal entries make two
  // clients look like one while the legend says otherwise.
  it('keeps every chart series colour distinct within a mode', () => {
    for (const mode of MODES) {
      const series = getTheme(mode, 'rtl').palette.chartSeries
      expect(new Set(series).size, mode).toBe(series.length)
    }
  })
})

// AGENTS.md "Two blues": #3460d6 is for filled buttons, bars and links, #3b6ef5
// for chips, segments and the nav rail.
describe('getTheme — the two blues stay separate', () => {
  it('keeps brandPrimary and primary.main distinct in light', () => {
    const { palette } = getTheme('light', 'rtl')

    expect(palette.brandPrimary).toBe('#3460d6')
    expect(palette.primary.main).toBe('#3b6ef5')
    expect(palette.brandPrimary).not.toBe(palette.primary.main)
  })

  it('keeps them distinct in dark too', () => {
    const { palette } = getTheme('dark', 'rtl')

    expect(palette.brandPrimary).not.toBe(palette.primary.main)
  })

  // `secondary` carries the brand blue so a tonal button can reach it.
  it('maps secondary.main onto the brand blue, not the chip blue', () => {
    expect(getTheme('light', 'rtl').palette.secondary.main).toBe(lightColors.brandPrimary)
    expect(getTheme('dark', 'rtl').palette.secondary.main).toBe(darkColors.brandPrimary)
  })

  // `primary` is a CONTAINER role: it fills backgrounds and draws non-text
  // marks, held to 3:1. Type is always `brandPrimary`. MUI resolves
  // `color="primary"` to `primary.main` for a LABEL unless a `variants` entry
  // says otherwise, which is how `variant="outlined"` shipped #3b6ef5 type at
  // 4.39:1. Ratios and the per-variant reasoning are in `theme.ts`.
  it('never paints primary.main as type in any component override', () => {
    for (const mode of MODES) {
      const { components, palette } = getTheme(mode, 'rtl')

      expect(JSON.stringify(components ?? {}), mode).not.toContain(`"color":"${palette.primary.main}"`)
    }
  })
})

describe('getTheme — direction', () => {
  // Emotion's RTL plugin reads nothing from the theme, but MUI's components do:
  // Drawer anchors, Tabs indicators, Slider and the date pickers branch on
  // `theme.direction`.
  it('carries the direction it was asked for', () => {
    expect(getTheme('light', 'rtl').direction).toBe('rtl')
    expect(getTheme('light', 'ltr').direction).toBe('ltr')
    expect(getTheme('dark', 'rtl').direction).toBe('rtl')
  })

  it('builds the same palette in both directions', () => {
    expect(getTheme('light', 'ltr').palette.brandPrimary).toBe(getTheme('light', 'rtl').palette.brandPrimary)
  })
})

describe('getTheme — caching', () => {
  // The provider re-renders on every settings read. A rebuilt theme is a new
  // object identity, which drops Emotion's cache and re-serialises every styled
  // component on the page.
  it('returns the same instance for the same arguments', () => {
    expect(getTheme('light', 'rtl')).toBe(getTheme('light', 'rtl'))
    expect(getTheme('dark', 'ltr')).toBe(getTheme('dark', 'ltr'))
  })

  // Keyed on mode alone, an RTL app would be handed the LTR theme.
  it('keys on both mode and direction', () => {
    const themes = [getTheme('light', 'rtl'), getTheme('light', 'ltr'), getTheme('dark', 'rtl'), getTheme('dark', 'ltr')]

    expect(new Set(themes).size).toBe(4)
  })
})

describe('getTheme — component overrides', () => {
  // A global `MuiPaper` backdrop-filter once put the app-chrome glass behind
  // every menu, dialog and select popover. Only the fixed chrome blurs, and it
  // applies its own.
  it('puts no backdrop blur on any component', () => {
    for (const mode of MODES) {
      expect(JSON.stringify(getTheme(mode, 'rtl').components ?? {}), mode).not.toContain('backdropFilter')
    }
  })

  // A translucent `paper` lets the page show through a dialog's own content.
  it('makes paper the opaque surface, not the glass fill', () => {
    const { palette } = getTheme('light', 'rtl')

    expect(palette.background.paper).toBe(lightColors.surfaceDefault)
    expect(palette.background.paper).not.toBe(lightColors.glassSurface)
  })
})

// The variants are the design's type ramp, sizes, not outline levels. MUI's
// default mapping renders `h5` as a real `<h5>`, so a card title that only
// wanted 16/600 skipped two levels under the page's `<h2>`: 82 of the suite's
// axe `heading-order` findings, none of them visible on screen.
describe('getTheme — typography maps size onto the right element', () => {
  // Read once, the theme is cached and never mutated.
  const variantMapping: NonNullable<TypographyProps['variantMapping']> =
    getTheme('light', 'rtl').components?.MuiTypography?.defaultProps?.variantMapping ?? {}

  // Three levels deep and no deeper: the wordmark, the page title, a section.
  it('sends every title size to the one section level the app has', () => {
    expect(variantMapping.h3).toBe('h3')
    expect(variantMapping.h4).toBe('h3')
    expect(variantMapping.h5).toBe('h3')
    expect(variantMapping.h6).toBe('h3')
  })

  it('keeps the page-title size on h2', () => {
    expect(variantMapping.h2).toBe('h2')
  })

  // `h1` is the 32px figure, the `subtitle` pair are field labels and row
  // values. MUI would make all three headings: `subtitle1`/`subtitle2` default
  // to `<h6>`.
  it('keeps figures and labels out of the outline entirely', () => {
    for (const variant of ['h1', 'subtitle1', 'subtitle2'] as const) {
      expect(variantMapping[variant], variant).not.toMatch(/^h[1-6]$/)
    }
  })

  // `component` beats the mapping, so AppShell's `variant="h3" component="h1"`
  // wordmark stays the app's only `<h1>`, and without one there is no outline
  // to be ordered.
  it('leaves h1 to be claimed explicitly, never by a variant', () => {
    expect(Object.values(variantMapping)).not.toContain('h1')
  })
})
