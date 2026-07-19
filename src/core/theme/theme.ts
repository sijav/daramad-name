import { createTheme } from '@mui/material'
import vazirFdRegular from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-Regular.woff2?url'
import vazirFdSemiBold from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-SemiBold.woff2?url'
import { elevation, fontFamily, fontFamilyFarsiDigits, mdSysColor, radius, spacingUnit } from './tokens'

// Maps the Figma MD3 tokens onto MUI's palette. Components must never reach
// into `tokens.ts` directly — they read `theme.palette.*` / `theme.shape.*` so
// that a future dark mode is a change in one file.
//
// MUI v9 ships CSS-variable theming; we opt in via `cssVariables` so the
// generated custom properties line up with the `--md-sys-color-*` names the
// design system already speaks.
export const theme = createTheme({
  cssVariables: { cssVarPrefix: 'md-sys' },
  direction: 'rtl',
  spacing: spacingUnit,
  shape: { borderRadius: radius.md },
  palette: {
    mode: 'light',
    primary: {
      main: mdSysColor.primary,
      contrastText: mdSysColor.onPrimary,
      light: mdSysColor.primaryContainer,
      dark: mdSysColor.onPrimaryContainer,
    },
    error: {
      main: mdSysColor.error,
      contrastText: mdSysColor.onError,
      light: mdSysColor.errorContainer,
      dark: mdSysColor.onErrorContainer,
    },
    success: {
      main: mdSysColor.success,
      light: mdSysColor.successContainer,
    },
    background: {
      default: mdSysColor.surface,
      paper: mdSysColor.glassSurface,
    },
    text: {
      primary: mdSysColor.onSurface,
      secondary: mdSysColor.onSurfaceVariant,
    },
    divider: mdSysColor.outlineVariant,
    // Extra MD3 roles that have no MUI equivalent. Declared in `theme.d.ts`.
    surfaceContainerHigh: mdSysColor.surfaceContainerHigh,
    outlineVariant: mdSysColor.outlineVariant,
    outline: mdSysColor.outline,
    glassSurface: mdSysColor.glassSurface,
    glassBorder: mdSysColor.glassBorder,
  },
  typography: {
    fontFamily,
    // Figma type ramp. Line heights are the design's px values, expressed
    // unitless so they survive a user font-size change.
    h1: { fontSize: 28, fontWeight: 700, lineHeight: 36 / 28 },
    h2: { fontSize: 24, fontWeight: 600, lineHeight: 32 / 24 },
    h3: { fontSize: 20, fontWeight: 600, lineHeight: 28 / 20 },
    body1: { fontSize: 16, fontWeight: 400, lineHeight: 26 / 16 },
    body2: { fontSize: 14, fontWeight: 400, lineHeight: 22 / 14 },
    subtitle2: { fontSize: 14, fontWeight: 600, lineHeight: 20 / 14 },
    button: { fontSize: 14, fontWeight: 600, lineHeight: 20 / 14, textTransform: 'none' },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 16 / 12 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.full, height: 52, paddingInline: 24 },
        sizeSmall: { height: 38, paddingInline: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.full, height: 38, paddingInline: 4 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // The glass treatment from the record card, applied to every surface.
        root: {
          backgroundImage: 'none',
          backdropFilter: elevation.glassBlur,
          border: `1px solid ${mdSysColor.glassBorder}`,
        },
        rounded: { borderRadius: radius.xxl },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: mdSysColor.surfaceContainerHigh,
          minHeight: 52,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        // The Farsi-Digits cut of Vazirmatn draws ASCII 0-9 with Persian
        // glyphs. Applied to the date picker's input, it shows «۱۴۰۵/۰۴/۲۸»
        // while the DOM value stays "1405/04/28".
        //
        // This matters because MUI X derives a field's section lengths by
        // probing `formatByString(...).startsWith('0')` against ASCII '0'.
        // Returning real Persian digits from the adapter makes that probe fail
        // and the picker throws. Solving it in the font keeps MUI's internals
        // on ASCII while the user still sees Persian numerals.
        '@font-face': [
          {
            fontFamily: 'Vazirmatn FD',
            fontWeight: 400,
            fontDisplay: 'swap',
            src: `url(${vazirFdRegular}) format('woff2')`,
          },
          {
            fontFamily: 'Vazirmatn FD',
            fontWeight: 600,
            fontDisplay: 'swap',
            src: `url(${vazirFdSemiBold}) format('woff2')`,
          },
        ],
        // Persian text must never fall back to a system font (pre-flight check #5).
        body: { fontFamily },
        // Tabular figures keep the ledger's toman column aligned.
        '.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
        // Opt-in class for inputs whose digits must look Persian but stay ASCII.
        '.farsi-digits': { fontFamily: fontFamilyFarsiDigits },
      },
    },
  },
})
