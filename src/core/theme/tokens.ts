// Design tokens from the Figma design system
// (DaramadName — Design system, file yW364nD8qVYhXKiOxNBShA).
//
// The design is Material Design 3, so the names below mirror the
// `--md-sys-color-*` custom properties in the Figma file rather than MUI's own
// palette vocabulary. `theme.ts` maps these onto MUI; nothing else should read
// raw hex values.

/** Every colour role the theme consumes. Both palettes must satisfy it. */
export interface ColorPalette {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  brandPrimary: string
  brandPrimaryHover: string
  brandPrimarySubtle: string
  textOnPrimary: string
  secondaryContainer: string
  onSecondaryContainer: string
  surface: string
  surfaceDefault: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurface: string
  onSurfaceVariant: string
  textSecondary: string
  outline: string
  outlineVariant: string
  neutralVariant: string
  /** `--border-default`: the 1px hairline on chart cards. */
  borderDefault: string
  borderStrong: string
  /** `--surface-subtle`: the unfilled part of a progress track. */
  surfaceSubtle: string
  /** Categorical series colours for the donut, in the design's order. */
  chartSeries: readonly string[]
  glassSurface: string
  success: string
  successContainer: string
  warning: string
  warningContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
}

/** Light palette, taken verbatim from the Figma variables. */
export const lightColors: ColorPalette = {
  primary: '#3b6ef5',
  onPrimary: '#ffffff',
  primaryContainer: '#dee7fd',
  onPrimaryContainer: '#0f1c3d',
  /** `--brand-primary`: a deeper blue the design uses for emphasis, distinct from `primary`. */
  brandPrimary: '#3460d6',
  brandPrimaryHover: '#2b51b8',
  brandPrimarySubtle: '#eff3fe',
  textOnPrimary: '#fdfeff',

  secondaryContainer: '#e2e4e9',
  onSecondaryContainer: '#2f3236',

  surface: '#f8f9fb',
  surfaceDefault: '#fdfeff',
  surfaceContainerHigh: '#e9eaec',
  surfaceContainerHighest: '#e4e5e7',
  onSurface: '#18191b',
  onSurfaceVariant: '#494b50',
  textSecondary: '#626569',

  outline: '#7c7e83',
  outlineVariant: '#c8cbcf',
  neutralVariant: '#95989c',
  borderDefault: '#dadde1',
  borderStrong: '#7c7e83',
  surfaceSubtle: '#f8f9fb',
  // blue/40, success/40, warning/40, neutral-variant/60 — the design uses a
  // categorical set here, not a single-hue ramp.
  chartSeries: ['#3b6ef5', '#2e9e5b', '#e2a400', '#95989c', '#6b93f7', '#7c7e83'],

  glassSurface: 'rgba(255, 255, 255, 0.6)',

  success: '#2e9e5b',
  successContainer: '#e6f5ec',
  warning: '#e2a400',
  warningContainer: '#fdf7ea',
  error: '#dc362e',
  onError: '#ffffff',
  errorContainer: '#f9dedc',
  onErrorContainer: '#410e0b',
}

/**
 * Dark palette.
 *
 * NOT in the Figma file — the design system only defines light values, so this
 * is derived here following MD3's dark guidance: the primary is lightened so it
 * still passes contrast on a dark surface (a #3b6ef5 button on near-black is
 * uncomfortably heavy), containers become dark tones of the same hue, and the
 * surface ramp inverts. Replace these wholesale if the design later ships real
 * dark tokens.
 */
export const darkColors: ColorPalette = {
  primary: '#a8c4ff',
  onPrimary: '#0a2472',
  primaryContainer: '#24427f',
  onPrimaryContainer: '#dbe4ff',
  brandPrimary: '#8fb0ff',
  brandPrimaryHover: '#a8c2ff',
  brandPrimarySubtle: '#1a2440',
  textOnPrimary: '#10131a',

  secondaryContainer: '#2f3236',
  onSecondaryContainer: '#e2e4e9',

  surface: '#121316',
  surfaceDefault: '#16171a',
  surfaceContainerHigh: '#26282c',
  surfaceContainerHighest: '#303237',
  onSurface: '#e4e5e7',
  onSurfaceVariant: '#c4c6ca',
  textSecondary: '#a8abaf',

  outline: '#8e9195',
  outlineVariant: '#44474b',
  neutralVariant: '#6b6e72',
  borderDefault: '#3a3d42',
  borderStrong: '#6d7075',
  surfaceSubtle: '#1d1f23',
  // Lightened so each series keeps its hue identity against a dark surface.
  chartSeries: ['#7ea6ff', '#5fc98a', '#f0c04a', '#a8abaf', '#9db8ff', '#8e9195'],

  // The glass treatment inverts: a light film on dark, not a white one.
  glassSurface: 'rgba(38, 40, 44, 0.6)',

  success: '#6edb9b',
  successContainer: '#12351f',
  warning: '#f5ca4a',
  warningContainer: '#3a2f14',
  error: '#f2b8b5',
  onError: '#601410',
  errorContainer: '#8c1d18',
  onErrorContainer: '#f9dedc',
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const

// The Figma file uses an 8pt grid; MUI's spacing(1) === 8px matches it exactly.
export const spacingUnit = 8

export const controlHeight = {
  medium: 40,
  large: 48,
} as const

export const elevation = {
  // Elevation/1 from the design system.
  level1: '0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 3px 0px rgba(0,0,0,0.10)',
  // Only the fixed app chrome blurs, so that scrolling content reads as
  // passing *behind* the bar rather than colliding with it.
  glassBlur: 'blur(12px)',
} as const

export const fontFamily = "'Vazirmatn Variable', 'Vazirmatn', system-ui, sans-serif"

/**
 * Vazirmatn's Farsi-Digits cut: ASCII 0-9 are drawn with Persian glyphs.
 * Used where a control must keep an ASCII DOM value but read as Persian —
 * chiefly the date picker, whose internals parse ASCII digits.
 */
export const fontFamilyFarsiDigits = "'Vazirmatn FD', 'Vazirmatn Variable', system-ui, sans-serif"

/** The design's FA type ramp, mapped to the MUI variants that use each one. */
export const typeScale = {
  numberLarge: { fontSize: 32, fontWeight: 700, lineHeight: 44 / 32 },
  headingMedium: { fontSize: 28, fontWeight: 700, lineHeight: 42 / 28 },
  titleLarge: { fontSize: 22, fontWeight: 600, lineHeight: 32 / 22 },
  titleMedium: { fontSize: 18, fontWeight: 600, lineHeight: 30 / 18 },
  /** FA/Title/Small — chart card headings; also FA/Number/Compact. */
  titleSmall: { fontSize: 16, fontWeight: 600, lineHeight: 26 / 16 },
  /** FA/Label/Medium — the client name beside a share bar. */
  labelMedium: { fontSize: 13, fontWeight: 500, lineHeight: 20 / 13 },
  /** FA/Body/Small — legend labels. */
  bodySmall: { fontSize: 13, fontWeight: 400, lineHeight: 22 / 13 },
  labelLarge: { fontSize: 14, fontWeight: 600, lineHeight: 22 / 14 },
  bodyLarge: { fontSize: 16, fontWeight: 400, lineHeight: 26 / 16 },
  bodyMedium: { fontSize: 14, fontWeight: 400, lineHeight: 24 / 14 },
  caption: { fontSize: 12, fontWeight: 400, lineHeight: 20 / 12 },
} as const

/** Back-compat alias: `mdSysColor` was the light palette before dark mode existed. */
export const mdSysColor = lightColors
