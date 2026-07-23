import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { createTheme, type Theme } from '@mui/material'
// Side-effect type import: it merges MUI X's own component keys (here
// `MuiPickersOutlinedInput`) into MUI's `Components` map. Without it the
// override below is a type error, and the picker keeps MUI X's defaults.
import type {} from '@mui/x-date-pickers/themeAugmentation'
import vazirFdRegular from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-Regular.woff2?url'
import vazirFdSemiBold from 'vazirmatn/misc/Farsi-Digits/fonts/webfonts/Vazirmatn-FD-SemiBold.woff2?url'
import {
  controlHeight,
  darkColors,
  elevation,
  fontFamily,
  fontFamilyFarsiDigits,
  lightColors,
  radius,
  spacingUnit,
  typeScale,
} from './tokens'

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
      // The ramp above names SIZES, not outline levels. `h5` is the design's
      // `titleSmall` (16/600), reached for because a thing wants 16px semibold,
      // not because it is the fifth level of the document. MUI's default
      // mapping welds the two together: a settings section title picked `h5`,
      // emitted a real `<h5>` under the page's `<h2>`, and that one mistake was
      // 82 of the suite's `heading-order` findings.
      //
      // `variantMapping` decides it once instead of asking every call site to
      // remember `component`, which still wins where a component means a level
      // (AppShell's wordmark is `variant="h3" component="h1"`).
      // mui.com/material-ui/react-typography/#changing-the-semantic-element
      //
      // The outline is three deep: h1 the wordmark, h2 the page title, h3 a
      // section or card title. So the four title sizes land on `h3`, and the
      // entries that are figures or labels rather than titles, `h1`, and the
      // `subtitle` pair, land on `p`. A partial map merges over MUI's defaults,
      // so `body*`, `caption` and `overline` keep their usual elements.
      //
      // Nothing moves visually: `Typography` sets `margin: 0`, so a `p` and an
      // `h5` with the same variant class render identically.
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            // `numberLarge`, the 32px figure on the charts page and the daily
            // total in Quick Entry. A number is not a heading.
            h1: 'p',
            // `headingMedium`, the page title, the one place the level and the
            // size agree.
            h2: 'h2',
            h3: 'h3',
            h4: 'h3',
            h5: 'h3',
            h6: 'h3',
            // `labelMedium` / `labelLarge`. MUI sends both to `<h6>` by
            // default, which is where the ledger totals, the settings row
            // labels and the client-share percentages were all becoming
            // headings.
            subtitle1: 'p',
            subtitle2: 'p',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.full,
            height: controlHeight.large,
            paddingInline: '24px',
            // Written out rather than using `disableElevation`, which emits its
            // own `box-shadow: none` that no override could beat, it swallowed
            // the focus ring's separation shadow at any specificity. Same flat
            // result, but now the rule below can win.
            boxShadow: 'none',
            '&:hover, &:active': { boxShadow: 'none' },
            // The sheet draws focus as two rings: a 2px `surface-default`
            // separation hugging the pill, then a 2px `border-focus` outside
            // it. `outline-offset` produces the same result with one ring
            // the 2px gap shows the page, which IS `surface-default`
            // everywhere a button sits. A box-shadow separation ring was tried
            // first and could not be made to stick: something in MUI's own
            // contained slot resets the shadow after every override.
            //
            // Either way it matters: MUI paints no visible focus ring on a
            // contained button at all, so keyboard users previously had none.
            '&.Mui-focusVisible': {
              outline: `2px solid ${c.borderFocus}`,
              outlineOffset: '2px',
            },
          },
          sizeSmall: { height: controlHeight.medium, paddingInline: '16px' },
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
              '&:active': { backgroundColor: c.brandPrimaryPressed },
            },
          },
          {
            // The tonal button beside it, "گزارش درآمد" on the ledger header.
            props: { variant: 'contained' as const, color: 'secondary' as const },
            style: {
              backgroundColor: c.brandPrimarySubtle,
              color: c.brandPrimary,
              '&:hover': { backgroundColor: c.primaryContainer },
            },
          },
          {
            // Tertiary. The sheet puts the text button on `--brand-primary`
            // too, MUI would otherwise resolve it to `primary.main` #3b6ef5,
            // the other blue, which is exactly the trap this palette documents.
            props: { variant: 'text' as const, color: 'primary' as const },
            style: {
              color: c.brandPrimary,
              '&:hover': { backgroundColor: c.brandPrimarySubtle },
              '&:active': { backgroundColor: c.primaryContainer },
            },
          },
          {
            // The secondary button was the last route by which `primary.main`
            // reached the screen as TYPE, and #3b6ef5 does not clear the 4.5:1
            // bar at 14/600: 4.39:1 on `surface-default`, 4.21:1 on
            // `surface-subtle`. `brandPrimary` is 5.49:1 and 5.26:1 there.
            //
            // Hence the rule the palette follows: `primary` is a CONTAINER
            // role. It fills backgrounds and draws non-text marks, held to 3:1.
            // Type, and any fill with type on it, is `brandPrimary`, which is
            // why filled, tonal, text and outlined all land on one ink.
            //
            // The border stays `outline`, the design edges this button in grey.
            props: { variant: 'outlined' as const, color: 'primary' as const },
            style: {
              color: c.brandPrimary,
              '&:hover': { backgroundColor: c.brandPrimarySubtle },
              '&:active': { backgroundColor: c.primaryContainer },
            },
          },
        ],
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${c.borderFocus}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          // A segment had NO focus indicator at all: `ButtonBase` paints none on
          // its own, and `SegmentedControl` sets `Mui-selected`'s background
          // itself, so the only state MUI does express got overwritten. A
          // keyboard user tabbing across the currency switch could not see
          // where they were. Same ring as Button and IconButton.
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${c.borderFocus}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      // MUI X renders its own outlined input, so NOTHING in `MuiOutlinedInput`
      // below reaches the date picker. The visible consequence was the focus
      // ring: the picker resolved it to `primary.main` #3b6ef5 while every
      // other field in the app focuses in `border-focus` #3460d6, the two
      // blues, one field apart.
      MuiPickersOutlinedInput: {
        styleOverrides: {
          root: {
            // The `:not(.Mui-error)` is not decoration, MUI X paints the focus
            // colour from a `variants` entry whose selector carries exactly
            // that clause, and a shorter selector here loses on specificity
            // while looking perfectly correct in the source. It also leaves an
            // invalid field focusing in `error.main`, which is what should
            // happen.
            '&.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: c.borderFocus,
              borderWidth: 2,
            },
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          // The design tints an unselected page on hover; MUI's default action
          // grey reads as a different component beside the brand-filled current
          // page.
          root: { '&:hover': { backgroundColor: c.brandPrimarySubtle } },
        },
      },
      MuiChip: {
        styleOverrides: {
          // 38px and Medium weight, per the design's Chip component. MUI's
          // default small chip is 32px/400 and read visibly lighter than the
          // channel pills in the record card.
          root: {
            borderRadius: radius.full,
            height: 38,
            fontWeight: 500,
            // Same story as the segments: `ChipSelect` paints the selected and
            // unselected fills itself, which beats MUI's focus-visible
            // background, the channel pills took keyboard focus and showed
            // nothing at all.
            //
            // The offset is NEGATIVE so the ring hugs the inside of the pill.
            // Outside a fully-rounded chip it would collide with its neighbour
            // across the row's 8px gap.
            '&.Mui-focusVisible': {
              outline: `2px solid ${c.borderFocus}`,
              outlineOffset: '-2px',
            },
          },
          sizeSmall: { height: 38 },
          label: { paddingInline: '16px' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          // The design's surface: a flat `surface-default` fill with a 1px
          // `border-default` hairline. NOT frosted, the earlier glass
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
            // `282:911` gives the field six states. Without these three, hover
            // darkened the outline to near-black, focus resolved to
            // `primary.main` #3b6ef5 rather than `border-focus` #3460d6, and a
            // disabled field looked identical to an enabled one.
            '&:hover': { backgroundColor: c.surfaceSubtle },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.borderStrong },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.borderFocus, borderWidth: 2 },
            '&.Mui-disabled': { backgroundColor: c.surfaceDisabled },
            '&.Mui-disabled .MuiInputBase-input': { WebkitTextFillColor: c.textDisabled },
          },
          // A multiline note grows, so it opts out of the fixed height above.
          //
          // MUST be on MuiOutlinedInput, not MuiInputBase: Emotion emits the
          // inner component's styles first, so an InputBase override lands
          // before `height: 52` at equal specificity and loses on source order.
          // The address field then overflowed its border by 20px past two lines.
          //
          // `padding` shorthand, not `paddingBlock`, so it also cancels MUI's
          // own multiline variants (`8.5px 14px` / `16.5px 14px`). Inline
          // padding is zero because the inset lives on the input slot below,
          // as it does for single-line fields; set on both, the address sits
          // twice as far in as the name field above it.
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
          // 8px corners and Elevation/1, not MUI's translucent grey.
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
          // the field dead to clicks, and this slot is what opens the menu. It
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
          // plugin mirrors, putting figures on the LEFT in Persian. A column
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
