import { createTheme, type Theme } from '@mui/material'
import vazirFdRegular from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-Regular.woff2?url'
import vazirFdSemiBold from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-SemiBold.woff2?url'
import { darkColors, fontFamily, fontFamilyFarsiDigits, lightColors, radius, spacingUnit, typeScale } from './tokens'

export type ThemeMode = 'light' | 'dark'
export type Direction = 'ltr' | 'rtl'

/**
 * Builds the MUI theme for a colour mode and text direction.
 *
 * A factory rather than a module-level constant because both inputs are runtime
 * settings the user controls. Results are cached below, since `createTheme` is
 * not cheap and this runs on every settings read.
 */
const buildTheme = (mode: ThemeMode, direction: Direction): Theme => {
  const c = mode === 'dark' ? darkColors : lightColors

  return createTheme({
    direction,
    spacing: spacingUnit,
    shape: { borderRadius: radius.md },
    palette: {
      mode,
      primary: { main: c.primary, contrastText: c.onPrimary, light: c.primaryContainer, dark: c.onPrimaryContainer },
      secondary: { main: c.brandPrimary, light: c.secondaryContainer, dark: c.onSecondaryContainer },
      error: { main: c.error, contrastText: c.onError, light: c.errorContainer, dark: c.onErrorContainer },
      success: { main: c.success, light: c.successContainer },
      warning: { main: c.warning, light: c.warningContainer },
      // `paper` is the design's opaque `surface-default`, not the translucent
      // glass fill. Every Paper in the app inherits this, including menus and
      // dialogs, which must not let content show through them.
      background: { default: c.surface, paper: c.surfaceDefault },
      text: { primary: c.onSurface, secondary: c.textSecondary },
      divider: c.outlineVariant,
      // Extra MD3 roles with no MUI equivalent. Declared in `muiPalette.d.ts`.
      surfaceContainerHigh: c.surfaceContainerHigh,
      surfaceContainerHighest: c.surfaceContainerHighest,
      surfaceDefault: c.surfaceDefault,
      outlineVariant: c.outlineVariant,
      outline: c.outline,
      glassSurface: c.glassSurface,
      brandPrimary: c.brandPrimary,
      brandPrimarySubtle: c.brandPrimarySubtle,
      borderDefault: c.borderDefault,
      surfaceSubtle: c.surfaceSubtle,
      chartSeries: c.chartSeries,
    },
    typography: {
      fontFamily,
      // The design's FA type ramp. Line heights are unitless so they survive a
      // user font-size change.
      h1: typeScale.numberLarge,
      h2: typeScale.headingMedium,
      h3: typeScale.titleMedium,
      h4: typeScale.titleLarge,
      h5: typeScale.titleSmall,
      subtitle1: typeScale.labelMedium,
      body1: typeScale.bodyLarge,
      body2: typeScale.bodyMedium,
      subtitle2: typeScale.labelLarge,
      button: { ...typeScale.labelLarge, textTransform: 'none' },
      caption: typeScale.caption,
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: radius.full, height: 48, paddingInline: 24 },
          sizeSmall: { height: 40, paddingInline: 16 },
          // The design outlines buttons in `--md-sys-color-outline`, not in a
          // half-transparent primary the way MUI does by default.
          outlined: { borderColor: c.outline },
        },
      },
      MuiChip: {
        styleOverrides: {
          // 38px and Medium weight, per the design's Chip component. MUI's
          // default small chip is 32px/400 and read visibly lighter than the
          // channel pills in the record card.
          root: { borderRadius: radius.full, height: 38, fontWeight: 500 },
          sizeSmall: { height: 38 },
          label: { paddingInline: 16 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          // The design's surface: a flat `surface-default` fill with a 1px
          // `border-default` hairline. NOT frosted — the earlier glass
          // treatment (translucent + 16px backdrop blur) came from a single
          // record card in an older revision, and applying it here put a blur
          // behind every menu, dialog and select popover in the app.
          root: {
            backgroundImage: 'none',
            border: `1px solid ${c.borderDefault}`,
          },
          // `--radius-xl`, the radius the design's content `Card` uses.
          rounded: { borderRadius: radius.xl },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          // The design's Field box is 52px. MUI's default vertical padding
          // pushed it to 56, so the padding is set rather than just a minHeight.
          root: { borderRadius: radius.md, backgroundColor: c.surfaceContainerHigh, height: 52 },
          input: { paddingBlock: 0, height: '100%', boxSizing: 'border-box' },
          notchedOutline: { borderColor: c.outlineVariant },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          // A multiline note has to grow, so it opts out of the fixed 52px.
          multiline: { height: 'auto', minHeight: 52, paddingBlock: 12 },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          // The Farsi-Digits cut draws ASCII 0-9 with Persian glyphs, which is
          // how the date picker shows «۱۴۰۵/۰۴/۲۸» while keeping an ASCII DOM
          // value that MUI X can measure.
          '@font-face': [
            { fontFamily: 'Vazirmatn FD', fontWeight: 400, fontDisplay: 'swap', src: `url(${vazirFdRegular}) format('woff2')` },
            { fontFamily: 'Vazirmatn FD', fontWeight: 600, fontDisplay: 'swap', src: `url(${vazirFdSemiBold}) format('woff2')` },
          ],
          body: { fontFamily },
          '.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
          '.farsi-digits': { fontFamily: fontFamilyFarsiDigits },
        },
      },
    },
  })
}

// Four combinations only, so they are built once and reused. Rebuilding on each
// render would discard Emotion's style cache along with them.
const cache = new Map<string, Theme>()

export const getTheme = (mode: ThemeMode, direction: Direction): Theme => {
  const key = `${mode}:${direction}`
  let cached = cache.get(key)
  if (!cached) {
    cached = buildTheme(mode, direction)
    cache.set(key, cached)
  }
  return cached
}

/** Default theme, for consumers with no settings context (tests, isolated stories). */
export const theme = getTheme('light', 'rtl')
