## props

- `label`: The text on the pill.
- `tone`: Which palette role the pill paints in. Defaults to the bordered neutral.
- `icon`: Optional leading glyph, sized to the caption text.

## stories

- `Channel`: The default read-only pill, used for a receipt's payment channel.
- `Frozen`: `primary` marks the frozen conversion on the receipt details drawer.
- `All Tones`: All four tones at once, for comparison. The gallery still renders from args, change the label or the icon and every pill follows, so this is a view of the same component, not a second one that happens to look like it.
