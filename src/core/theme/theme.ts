import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { createTheme, type Theme } from '@mui/material'
import vazirFdRegular from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-Regular.woff2?url'
import vazirFdSemiBold from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-SemiBold.woff2?url'
import { darkColors, elevation, fontFamily, fontFamilyFarsiDigits, lightColors, radius, spacingUnit, typeScale } from './tokens'

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
      brandPrimaryHover: c.brandPrimaryHover,
      brandPrimarySubtle: c.brandPrimarySubtle,
      textOnPrimary: c.textOnPrimary,
      borderDefault: c.borderDefault,
      borderStrong: c.borderStrong,
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
          root: { borderRadius: radius.full, height: 48, paddingInline: '24px' },
          sizeSmall: { height: 40, paddingInline: '16px' },
          // The design outlines buttons in `--md-sys-color-outline`, not in a
          // half-transparent primary the way MUI does by default.
          outlined: { borderColor: c.outline },
        },
        // MUI v9 styles colour-specific variants through `variants`, not the
        // old `containedPrimary` slot.
        variants: [
          {
            // Filled buttons use `--brand-primary` (#3460d6), a step darker
            // than `--md-sys-color-primary` (#3b6ef5), which the design
            // reserves for chips, segments and the nav rail. They are two
            // different colours; using `primary.main` for both made every CTA
            // visibly too light.
            props: { variant: 'contained' as const, color: 'primary' as const },
            style: {
              backgroundColor: c.brandPrimary,
              color: c.textOnPrimary,
              '&:hover': { backgroundColor: c.brandPrimaryHover },
            },
          },
          {
            // The tonal button beside it — "گزارش درآمد" on the ledger header.
            props: { variant: 'contained' as const, color: 'secondary' as const },
            style: {
              backgroundColor: c.brandPrimarySubtle,
              color: c.brandPrimary,
              '&:hover': { backgroundColor: c.primaryContainer },
            },
          },
        ],
      },
      MuiChip: {
        styleOverrides: {
          // 38px and Medium weight, per the design's Chip component. MUI's
          // default small chip is 32px/400 and read visibly lighter than the
          // channel pills in the record card.
          root: { borderRadius: radius.full, height: 38, fontWeight: 500 },
          sizeSmall: { height: 38 },
          label: { paddingInline: '16px' },
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
      MuiAlert: {
        styleOverrides: {
          // The design's inline notice (the Quick Entry rate callout) is
          // `--radius-lg`, not the 20px a page-level card uses. An alert always
          // sits inside another surface, so it takes the smaller radius.
          root: { borderRadius: radius.lg },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          // The design's `Field` box (`43:16`): 52px on `surface-default` with
          // a 1px `border-default` hairline and 14px inline padding. MUI's
          // default vertical padding pushes it to 56, so height is set rather
          // than just a minHeight.
          root: {
            borderRadius: radius.md,
            backgroundColor: c.surfaceDefault,
            height: 52,
          },
          // A multiline note has to grow, so it opts out of the fixed height.
          //
          // This MUST live on MuiOutlinedInput, not MuiInputBase. Emotion emits
          // the inner component's styles first, so an InputBase override lands
          // BEFORE the `height: 52` above in the same generated class — equal
          // specificity, and source order decides. The opt-out silently lost,
          // and the address field's text overflowed its own border by 20px in
          // either direction once it grew past two lines.
          //
          // `padding` shorthand rather than `paddingBlock`, so it also cancels
          // MUI's own multiline variants (`8.5px 14px` / `16.5px 14px`).
          //
          // Inline padding is deliberately ZERO here: the inset stays on the
          // input slot below, exactly as it does for single-line fields. Set it
          // on both and the address sits twice as far in as the name field
          // directly above it.
          multiline: {
            height: 'auto',
            minHeight: 52,
            padding: '12px 0',
          },
          input: {
            paddingBlock: '0px',
            // The inset lives on the INPUT slot, not the root. A Select's click
            // target is that slot, so padding on the root leaves a dead band
            // around the edge where clicking does not open the menu.
            paddingInline: '14px',
            height: '100%',
            boxSizing: 'border-box',
            // Attached to the input slot, NOT written as a descendant rule in
            // an `sx`: `& .MuiInputBase-input::placeholder` crashes stylis'
            // prefixer, and the boundary swallows it.
            '&::placeholder': { color: c.textSecondary, opacity: 1 },
          },
          notchedOutline: {
            borderColor: c.borderDefault,
            // The label sits ABOVE the box in this design, so the outline has
            // no notch to cut for it. MUI raises the outline 5px and insets it
            // 8px to make room for that notch; with the legend gone both are
            // pure overhang, and the raise showed as a white sliver along the
            // top edge of every field.
            top: 0,
            paddingInline: 0,
            '& legend': { display: 'none' },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          // `225:263`: a dark `text-primary` chip with `surface-default` text,
          // 8px corners and Elevation/1 — not MUI's translucent grey.
          tooltip: {
            backgroundColor: c.onSurface,
            color: c.surfaceDefault,
            ...typeScale.caption,
            borderRadius: radius.sm,
            paddingInline: '10px',
            paddingBlock: '6px',
            boxShadow: elevation.level1,
          },
          arrow: { color: c.onSurface },
        },
      },
      MuiSelect: {
        styleOverrides: {
          // MUI sizes this slot to one line and centres it, leaving the rest of
          // the field dead to clicks — and this slot is what opens the menu. It
          // fills the field instead, so the whole control is the target.
          select: {
            minHeight: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
          },
        },
      },
      MuiInputLabel: {
        // `43:15`: the label is a 14/600 line above the field, not a caption
        // floating on the border. Forcing `shrink` keeps MUI from animating it
        // down into the box when the field is empty.
        defaultProps: { shrink: true },
        styleOverrides: {
          outlined: {
            position: 'static',
            transform: 'none',
            maxWidth: '100%',
            marginBottom: 8,
            ...typeScale.labelLarge,
            color: c.textSecondary,
            '&.Mui-focused': { color: c.textSecondary },
          },
        },
      },
      // Tables carry the design's ramp themselves, so a row never needs an
      // `sx` to look right. `267:1015` is 14/400 lh24 on `text-primary` for
      // body cells; `267:984` is 14/600 on `text-secondary` over
      // `surface-subtle` for the head.
      MuiTableCell: {
        styleOverrides: {
          root: {
            ...typeScale.bodyMedium,
            color: c.onSurface,
            borderBottom: `1px solid ${c.borderDefault}`,
            // The design's row is `px-20` with a `16px` gap between columns, so
            // a cell carries half the gap on each side and the full inset at
            // the ends. Without this the date sits flush against the client.
            paddingInline: '8px',
            paddingBlock: '14px',
            '&:first-of-type': { paddingInlineStart: '20px' },
            '&:last-of-type': { paddingInlineEnd: '20px' },
          },
          // `align="right"` emits `text-align: right`, which the stylis RTL
          // plugin mirrors — putting figures on the LEFT in Persian. A column
          // of numbers reads right-aligned in either direction, so this
          // counter-flips: authoring `left` in RTL makes the plugin emit
          // `right`.
          alignRight: { textAlign: direction === 'rtl' ? 'left' : 'right' },
          head: {
            ...typeScale.labelLarge,
            color: c.textSecondary,
            backgroundColor: c.surfaceSubtle,
            paddingBlock: '11px',
          },
        },
      },
      MuiTableSortLabel: {
        // The design sorts with a chevron, not MUI's downward arrow.
        defaultProps: { IconComponent: KeyboardArrowDownRoundedIcon },
        styleOverrides: {
          root: {
            gap: 4,
            color: 'inherit',
            '&:hover': { color: c.onSurface },
            '&.Mui-active': { color: c.brandPrimary },
            '&.Mui-active .MuiTableSortLabel-icon': { color: c.brandPrimary, opacity: 1 },
          },
          icon: { fontSize: 16, opacity: 0.5, margin: 0 },
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
