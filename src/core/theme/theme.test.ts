import { describe, expect, it } from 'vitest'
import { getTheme } from './theme'
import { darkColors, lightColors } from './tokens'

// The theme is the only place a colour is allowed to exist, so a role that is
// missing, wrong or shared between the two blues does not fail loudly — it
// paints. Three components once hardcoded hex and were unreadable in dark mode;
// these assertions are what stops the palette drifting back into that state.

/** The MD3 roles `muiPalette.d.ts` adds — every one is read by some component. */
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
  // A component reading `theme.palette.borderDefault` on a theme that never
  // wired the role gets `undefined`, which CSS drops silently: the hairline
  // just disappears. Nothing throws and nothing logs.
  it('wires every extra MD3 role in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { palette } = getTheme(mode, 'rtl')
      for (const role of EXTRA_ROLES) {
        expect(palette[role], `${mode}.${role}`).toMatch(/^(#|rgba?\()/)
      }
      expect(palette.chartSeries.length, `${mode}.chartSeries`).toBeGreaterThanOrEqual(4)
    }
  })

  // The dark palette is derived by hand in `tokens.ts`, so the failure mode is
  // adding a role to the light set and forgetting the dark one. A role with the
  // same value in both modes is a light colour showing on a near-black surface.
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

  // `mode` is what MUI's own components branch on — a Menu, a disabled input,
  // an Alert all pick their own greys from it. Building a dark palette while
  // leaving `mode: 'light'` produces dark surfaces with MUI's light defaults on
  // top of them.
  it('reports its own mode', () => {
    expect(getTheme('light', 'rtl').palette.mode).toBe('light')
    expect(getTheme('dark', 'rtl').palette.mode).toBe('dark')
  })

  // The donut colours a client per series. Two identical entries make two
  // clients indistinguishable in the chart while the legend claims otherwise.
  it('keeps every chart series colour distinct within a mode', () => {
    for (const mode of ['light', 'dark'] as const) {
      const series = getTheme(mode, 'rtl').palette.chartSeries
      expect(new Set(series).size, mode).toBe(series.length)
    }
  })
})

// AGENTS.md documents this as a trap: #3460d6 is for filled buttons, bars and
// links; #3b6ef5 is for chips, segments and the nav rail. Collapsing them onto
// `primary.main` made every CTA visibly too light, and nothing failed.
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

  // `secondary` carries the brand blue so a tonal button can reach it; if it
  // silently became `primary` the two would merge again by another route.
  it('maps secondary.main onto the brand blue, not the chip blue', () => {
    expect(getTheme('light', 'rtl').palette.secondary.main).toBe(lightColors.brandPrimary)
    expect(getTheme('dark', 'rtl').palette.secondary.main).toBe(darkColors.brandPrimary)
  })

  // The rule that separates them, stated once: `primary` is a CONTAINER role.
  // It fills a background under `primary.dark` and draws non-text marks — a
  // border, a dot, an icon on `primary.light`, all held to 3:1. It never draws
  // type: #3b6ef5 is 4.39:1 on `surface-default` and 4.21:1 on `surface-subtle`,
  // under the 4.5:1 bar wherever it lands. `brandPrimary` #3460d6 is the ink,
  // at 5.49:1 and 5.26:1 on the same two.
  //
  // The theme is where that breaks silently, because MUI resolves
  // `color="primary"` to `primary.main` for a LABEL unless a `variants` entry
  // says otherwise — which is how `variant="outlined"` shipped 14/600 #3b6ef5
  // on every page. One step of blue: invisible in review, and axe found it
  // seven times.
  it('never paints primary.main as type in any component override', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { components, palette } = getTheme(mode, 'rtl')

      expect(JSON.stringify(components ?? {}), mode).not.toContain(`"color":"${palette.primary.main}"`)
    }
  })
})

describe('getTheme — direction', () => {
  // Emotion's RTL plugin reads nothing from the theme, but MUI's own components
  // do: Drawer anchors, Tabs indicators, Slider and the date pickers all branch
  // on `theme.direction`. A theme built LTR inside an RTL app mirrors half the
  // app and not the other half.
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
  // Every settings read re-renders the provider. Rebuilding the theme each time
  // returns a new object identity, which invalidates Emotion's style cache and
  // makes MUI re-serialise every styled component on the page.
  it('returns the same instance for the same arguments', () => {
    expect(getTheme('light', 'rtl')).toBe(getTheme('light', 'rtl'))
    expect(getTheme('dark', 'ltr')).toBe(getTheme('dark', 'ltr'))
  })

  // A cache keyed on mode alone would hand an RTL app the LTR theme — the bug
  // the composite key exists to prevent.
  it('keys on both mode and direction', () => {
    const themes = [getTheme('light', 'rtl'), getTheme('light', 'ltr'), getTheme('dark', 'rtl'), getTheme('dark', 'ltr')]

    expect(new Set(themes).size).toBe(4)
  })
})

describe('getTheme — component overrides', () => {
  // A global `MuiPaper` backdrop-filter once leaked the app-chrome glass into
  // every menu, dialog and select popover. Only the fixed chrome may blur, and
  // it applies its own — nothing in the theme should.
  it('puts no backdrop blur on any component', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(JSON.stringify(getTheme(mode, 'rtl').components ?? {}), mode).not.toContain('backdropFilter')
    }
  })

  // The design's surface is opaque. A translucent `paper` lets a dialog's own
  // content show the page through it.
  it('makes paper the opaque surface, not the glass fill', () => {
    const { palette } = getTheme('light', 'rtl')

    expect(palette.background.paper).toBe(lightColors.surfaceDefault)
    expect(palette.background.paper).not.toBe(lightColors.glassSurface)
  })
})

// The typography variants are the design's type ramp — sizes, not outline
// levels. MUI's default mapping renders `h5` as a real `<h5>`, so a card title
// that only wanted 16/600 skipped two heading levels under the page's `<h2>`;
// axe's `heading-order` reported it 82 times across the suite. Nothing about
// that failure is visible, which is exactly why it is asserted here.
describe('getTheme — typography maps size onto the right element', () => {
  const mapping = (): Record<string, string> => {
    const props = getTheme('light', 'rtl').components?.MuiTypography?.defaultProps
    return (props?.variantMapping ?? {}) as Record<string, string>
  }

  // Three levels deep and no deeper: the wordmark, the page title, a section.
  it('sends every title size to the one section level the app has', () => {
    const map = mapping()

    expect(map.h3).toBe('h3')
    expect(map.h4).toBe('h3')
    expect(map.h5).toBe('h3')
    expect(map.h6).toBe('h3')
  })

  it('keeps the page-title size on h2', () => {
    expect(mapping().h2).toBe('h2')
  })

  // `numberLarge` is the 32px figure and the `subtitle` pair are field labels
  // and row values. MUI would make all three headings — `subtitle1`/`subtitle2`
  // default to `<h6>`, which is where the ledger totals and settings row labels
  // were entering the outline.
  it('keeps figures and labels out of the outline entirely', () => {
    const map = mapping()

    for (const variant of ['h1', 'subtitle1', 'subtitle2']) {
      expect(map[variant], variant).not.toMatch(/^h[1-6]$/)
    }
  })

  // The one heading the app declares by hand. `component` beats the mapping, so
  // AppShell's `variant="h3" component="h1"` wordmark has to survive it — with
  // no `<h1>` there is no document outline to be ordered in the first place.
  it('leaves h1 to be claimed explicitly, never by a variant', () => {
    expect(Object.values(mapping())).not.toContain('h1')
  })
})
