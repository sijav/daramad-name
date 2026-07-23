// Design tokens from the Figma design system, file yW364nD8qVYhXKiOxNBShA.
// The design is Material Design 3, so these names mirror the file's
// `--md-sys-color-*` custom properties rather than MUI's palette vocabulary.
// `theme.ts` maps them onto MUI; nothing else should read a raw hex.

/** Every colour role the theme consumes. */
export interface ColorPalette {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  brandPrimary: string
  brandPrimaryHover: string
  brandPrimaryPressed: string
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
  /** `--border-default`: the app's 1px hairline, on every Paper, table cell and field outline. */
  borderDefault: string
  borderStrong: string
  /**
   * The focus ring. Holds the same value as `brandPrimary` in both palettes but
   * is a role of its own, because without it focus states resolve to MUI's
   * `primary.main` #3b6ef5, the other blue.
   */
  borderFocus: string
  surfaceDisabled: string
  textDisabled: string
  /** `--surface-subtle`: table heads, field hover, progress tracks, nested figure boxes. */
  surfaceSubtle: string
  /** Categorical series colours, in the design's order. */
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

/** Light palette from the Figma variables, apart from the three contrast fixes noted below. */
export const lightColors: Readonly<ColorPalette> = {
  primary: '#3b6ef5',
  onPrimary: '#ffffff',
  primaryContainer: '#dee7fd',
  onPrimaryContainer: '#0f1c3d',
  /** `--brand-primary`: a deeper blue the design uses for emphasis, distinct from `primary`. */
  brandPrimary: '#3460d6',
  brandPrimaryHover: '#2c53b8',
  brandPrimaryPressed: '#254599',
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
  borderFocus: '#3460d6',
  surfaceDisabled: '#eeeff1',
  textDisabled: '#626569',
  surfaceSubtle: '#f8f9fb',
  // blue/40, success/40, warning/40, neutral-variant/60. The design specifies a
  // categorical set here, not a single-hue ramp, and these keep the Figma tones
  // (#2e9e5b, #e2a400) that `success` and `warning` below had to leave behind: a
  // filled slice is not held to the 4.5:1 that 12px type is.
  chartSeries: ['#3b6ef5', '#2e9e5b', '#e2a400', '#95989c', '#6b93f7', '#7c7e83'],

  glassSurface: 'rgba(255, 255, 255, 0.6)',

  // These three are the only roles that deviate from Figma. The sheet's
  // success/40 #2e9e5b, warning/40 #e2a400 and error #dc362e are all drawn as
  // TEXT on their own container, the `Tag` pair, the `InsightCallout` sentence,
  // `Field`'s helper line under an invalid input, and none of them reaches
  // 4.5:1 there. Each is darkened in HSL lightness ONLY, hue and saturation held
  // exactly at the design's values, by the least that clears the bar. The
  // containers are untouched, so every tinted background still matches Figma.
  // Tokens.mdx measures each pair live.
  success: '#247c48',
  successContainer: '#eef7f1',
  warning: '#906800',
  warningContainer: '#fdf7ea',
  error: '#da2d25',
  onError: '#ffffff',
  errorContainer: '#fceeee',
  onErrorContainer: '#410e0b',
}

/**
 * Dark palette. NOT in the Figma file, which defines light values only, so it is
 * derived here per MD3's dark guidance: the primary lightens to keep its
 * contrast on a dark surface, containers become dark tones of the same hue, and
 * the surface ramp inverts. Replace wholesale if the design ships real dark
 * tokens.
 */
export const darkColors: Readonly<ColorPalette> = {
  primary: '#a8c4ff',
  onPrimary: '#0a2472',
  primaryContainer: '#24427f',
  onPrimaryContainer: '#dbe4ff',
  brandPrimary: '#8fb0ff',
  brandPrimaryHover: '#a8c2ff',
  brandPrimaryPressed: '#c3d5ff',
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
  borderFocus: '#8fb0ff',
  surfaceDisabled: '#212328',
  textDisabled: '#6d7075',
  surfaceSubtle: '#1d1f23',
  // Lightened so each series keeps its hue identity against a dark surface.
  chartSeries: ['#7ea6ff', '#5fc98a', '#f0c04a', '#a8abaf', '#9db8ff', '#8e9195'],

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
  full: 999,
} as const

// Figma's 8pt grid, fed to MUI's `spacing`, so `spacing(1)` is 8px.
export const spacingUnit = 8

/** Button heights from the design system. */
export const controlHeight = {
  medium: 40,
  large: 48,
} as const

export const elevation = {
  // Elevation/1 from the design system.
  level1: '0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 3px 0px rgba(0,0,0,0.10)',
  // Only the fixed app chrome (top bar, bottom nav) may blur. A global
  // `MuiPaper` backdrop-filter once leaked this into every menu and dialog.
  glassBlur: 'blur(12px)',
} as const

export const fontFamily = "'Vazirmatn Variable', 'Vazirmatn', system-ui, sans-serif"

/**
 * Vazirmatn's Farsi-Digits cut draws ASCII 0-9 with Persian glyphs, for controls
 * that must keep an ASCII DOM value while reading as Persian. Chiefly the date
 * picker, whose internals parse ASCII digits.
 */
export const fontFamilyFarsiDigits = "'Vazirmatn FD', 'Vazirmatn Variable', system-ui, sans-serif"

/** The design's FA type ramp. `theme.ts` maps these onto the MUI variants. */
export const typeScale = {
  numberLarge: { fontSize: 32, fontWeight: 700, lineHeight: 44 / 32 },
  headingMedium: { fontSize: 28, fontWeight: 700, lineHeight: 42 / 28 },
  titleLarge: { fontSize: 22, fontWeight: 600, lineHeight: 32 / 22 },
  titleMedium: { fontSize: 18, fontWeight: 600, lineHeight: 30 / 18 },
  /** FA/Title/Small, chart panel and settings section titles; also FA/Number/Compact. */
  titleSmall: { fontSize: 16, fontWeight: 600, lineHeight: 26 / 16 },
  /** FA/Label/Medium, the client name beside a share bar in `TopCustomers`. */
  labelMedium: { fontSize: 13, fontWeight: 500, lineHeight: 20 / 13 },
  /** FA/Body/Small. In the design's ramp, but nothing in the app reads it yet. */
  bodySmall: { fontSize: 13, fontWeight: 400, lineHeight: 22 / 13 },
  labelLarge: { fontSize: 14, fontWeight: 600, lineHeight: 22 / 14 },
  /** FA/Number/Table, the ledger row's amount, which `LedgerTable` styles inline instead of reading this. */
  numberTable: { fontSize: 14, fontWeight: 600, lineHeight: 24 / 14 },
  bodyLarge: { fontSize: 16, fontWeight: 400, lineHeight: 26 / 16 },
  bodyMedium: { fontSize: 14, fontWeight: 400, lineHeight: 24 / 14 },
  caption: { fontSize: 12, fontWeight: 400, lineHeight: 20 / 12 },
} as const
