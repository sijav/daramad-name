The only thing between a settings row and what the user sees: it resolves the
colour mode, picks the Emotion cache that mirrors the layout, and hands MUI a
direction. All three fail without an error. The app still renders, just in the
wrong scheme or mirrored the wrong way.

These stories render a probe inside a second provider. The theme and the Emotion
cache come from context, so those assertions really are about the provider under
test. `dir`, `lang` and `color-scheme` are not: they are written to `<html>` from
an effect, and effects flush children-first, so the decorator's own provider
writes last and wins. Stories that read the document pin the matching toolbar
globals, or the assertion measures the toolbar instead.

## props

- `locale`: Sets text direction, not the translation. `fa-IR` selects the RTL Emotion cache, so every rule authored for LTR is mirrored on the way out. The catalog is loaded elsewhere.
- `themePreference`: `system` follows the OS setting, and keeps following it as it changes.
- `children`: The whole app. Everything below reads the theme and the cache.

## stories

- `Light`: A pinned `light` preference stays light, and `<html>` carries it. Screen readers, native form controls and the scrollbar read `dir`, `lang` and `color-scheme` from there and nowhere else; the MUI theme reaches none of them.
- `Dark`: A pinned `dark` preference swaps the palette, not just the flag. The assertion reads a painted colour rather than `palette.mode`, because three components once hardcoded hex and kept their light values while `mode` reported dark.
- `System`: `system` follows the OS. The expected value is computed from the media query rather than written down, so a flipped ternary cannot pass on a machine that happens to match the default.
- `Persian Mirrors The Layout`: Persian mirrors the layout through Emotion, not through component code. If the stylis plugin is not wired, or `stylis` drifts off the 4.2.0 the cache bundles, nothing throws: the CSS stops being flipped and every inset lands on the wrong side.
- `English Keeps The Layout`: English keeps the rule as authored, so nothing is flipped.
- `Figures Stay Right Aligned In Persian`: A money column is right-aligned in both directions. `align="right"` emits `text-align: right`, which the RTL plugin mirrors to the left, so the theme counter-flips and authors `left` under RTL.
- `Figures Stay Right Aligned In English`: The same column in English, where nothing is mirrored. Without it, a theme that hardcoded `right` would pass the Persian half on its own.
- `The Two Blues Are Painted`: The two blues in the jobs that keep them apart. #3460d6 fills a button, because a fill carries type and must reach 4.5:1 against it. #3b6ef5 edges a chip, because a border is non-text and needs 3:1.
- `Every Button Ink Is The Brand Blue`: `primary` never draws type; `brandPrimary` does. One MUI default is enough to break it: `variant="outlined"` resolved its label to `primary.main`, putting 14/600 #3b6ef5 on `surface-default` at 4.39:1. One step of blue, so it is asserted rather than reviewed.

## names

- `Light`: روشن
- `Dark`: تیره
- `System`: پیرویِ سیستم
- `Persian Mirrors The Layout`: آینه‌شدن در فارسی
- `English Keeps The Layout`: چیدمانِ دست‌نخورده در انگلیسی
- `Figures Stay Right Aligned In Persian`: راست‌چینیِ رقم‌ها در فارسی
- `Figures Stay Right Aligned In English`: راست‌چینیِ رقم‌ها در انگلیسی
- `The Two Blues Are Painted`: دو آبی، کشیده‌شده
- `Every Button Ink Is The Brand Blue`: جوهرِ دکمه‌ها، آبیِ برند
