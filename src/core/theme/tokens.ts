// Design tokens lifted verbatim from the Figma design system
// (DaramadName — Design system, file yW364nD8qVYhXKiOxNBShA).
//
// The design is Material Design 3, so the names below mirror the `--md-sys-color-*`
// custom properties in the Figma file rather than MUI's own palette vocabulary.
// `src/core/theme/theme.ts` maps these onto MUI's palette; nothing else should
// read raw hex values.

export const mdSysColor = {
  primary: '#3b6ef5',
  onPrimary: '#ffffff',
  primaryContainer: '#dee7fd',
  onPrimaryContainer: '#0f1c3d',

  surface: '#f7f8fa',
  surfaceContainerHigh: '#e9eaec',
  onSurface: '#18191b',
  onSurfaceVariant: '#494b50',

  outline: '#7c7e83',
  outlineVariant: '#c8cbcf',

  // The record card and nav rail float on a blurred translucent pane.
  glassSurface: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',

  // Not present in the Figma file, but every app needs them. Chosen to sit
  // beside the primary blue without competing with it.
  error: '#b3261e',
  onError: '#ffffff',
  errorContainer: '#f9dedc',
  onErrorContainer: '#410e0b',
  success: '#1f6f43',
  successContainer: '#d7f0e0',
} as const

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

export const elevation = {
  // shadow-[0px_16px_48px_0px_rgba(0,0,0,0.18)] on the record card
  card: '0px 16px 48px 0px rgba(0, 0, 0, 0.18)',
  glassBlur: 'blur(16px)',
} as const

export const fontFamily = "'Vazirmatn Variable', 'Vazirmatn', system-ui, sans-serif"

/**
 * Vazirmatn's Farsi-Digits cut: ASCII 0-9 are drawn with Persian glyphs.
 * Used where a control must keep an ASCII DOM value but read as Persian —
 * chiefly the date picker, whose internals parse ASCII digits.
 */
export const fontFamilyFarsiDigits = "'Vazirmatn FD', 'Vazirmatn Variable', system-ui, sans-serif"
