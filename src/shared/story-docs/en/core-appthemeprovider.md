The only thing standing between a settings row and what the user actually sees:
it resolves the colour mode, picks the Emotion cache that mirrors the whole
layout, and hands MUI a direction. Every one of those fails silently, the app
still renders, just in the wrong scheme or mirrored the wrong way.

These stories render a probe INSIDE a second provider. The theme and the Emotion
cache come from context, so those assertions really are about the provider under
test. `dir`, `lang` and `color-scheme` do not: they are written to `<html>` from
an effect, effects flush children-first, and the decorator's own provider
therefore writes last and wins. Every story that reads the document pins the
matching toolbar globals so the two agree, otherwise the assertion is measuring
the toolbar and passes only by coincidence.

## props

- `locale`: Decides text DIRECTION, not the translation: `fa-IR` selects the RTL Emotion cache, so every rule the app authors for LTR is mirrored on the way out. The catalog is loaded elsewhere.
- `themePreference`: `system` follows the OS setting and keeps following it as it changes.
- `children`: The whole app: everything below here reads the theme and the cache.

## stories

- `Light`: A pinned `light` preference stays light, and the document carries it. `dir`, `lang` and `color-scheme` live on `<html>` because screen readers, native form controls and the scrollbar read them from there and from nowhere else, the MUI theme is invisible to all three.
- `Dark`: A pinned `dark` preference must swap the actual palette, not just the flag. Asserting on a painted colour rather than on `palette.mode` is deliberate: three components once hardcoded hex and kept their light values here while `mode` reported dark quite happily.
- `System`: `system` follows the OS. A flipped ternary here would look correct to anyone whose machine matches the default, which is why the expectation is computed from the media query rather than written down.
- `Persian Mirrors The Layout`: Persian mirrors the layout through Emotion, not through component code. If the stylis plugin is not wired, or `stylis` drifts off the 4.2.0 the cache bundles, nothing throws: the CSS simply stops being flipped and every inset in the app lands on the wrong side.
- `English Keeps The Layout`: English keeps the same rule authored physically, so nothing is flipped.
- `Figures Stay Right Aligned In Persian`: A column of money reads right-aligned in BOTH directions. `align="right"` emits `text-align: right`, which the RTL plugin dutifully mirrors to the left, so the theme counter-flips and authors `left` under RTL. Get either half wrong and the figures land on the wrong edge in exactly one language.
- `Figures Stay Right Aligned In English`: The same column in English, where nothing is mirrored at all. Asserting only the Persian half would pass on a theme that hardcoded `right` and broke nothing visible until someone read the English report.
- `The Two Blues Are Painted`: The two blues, as painted, and in the two jobs that keep them apart. #3460d6 FILLS a button, because a fill carries type and has to reach 4.5:1 against it. #3b6ef5 EDGES a chip, because a border is non-text and only has to reach 3:1. They are one step apart, so merging them onto `primary.main` is invisible in review and obvious beside the design.
- `Every Button Ink Is The Brand Blue`: `primary` never draws type; `brandPrimary` does. The rule reads cleanly and paints wrongly the moment one MUI default slips through, which is exactly what happened: `variant="outlined"` resolved its label to `primary.main` and put 14/600 #3b6ef5 on `surface-default` at 4.39:1. Nothing about that is visible, it is one step of blue, so it is asserted rather than reviewed.
