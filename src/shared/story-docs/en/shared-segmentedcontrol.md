## stories

- `Currency`: The currency picker from the record card: a filled primary pill on a recessed track.
- `Two Options`: Two segments, the report's language switch.
- `Subtle`: The report config's lighter treatment: a recessed track with a raised segment.
- `Disabled`: `disabled` is not a prop this component declares, it rides the rest spread through to `ToggleButtonGroup`. No page passes it yet, so this story is the only thing showing what the state looks like and the only proof that the spread reaches the group at all.
- `A Focused Segment Is Ringed`: A focused segment has to be visible. `ButtonBase` paints no focus indicator of its own, and this control sets the selected segment's background itself, which overwrote the one state MUI does express. Tabbing across the currency switch moved nothing on screen. The theme now gives `ToggleButton` the same `border-focus` ring Button and IconButton already had.
- `Clicking The Selected Segment Is Ignored`: A segmented control can never end up with nothing selected. `ToggleButtonGroup` reports `null` when the user clicks the segment that is already on, taking that at face value would leave the currency unset, and an unset currency means an amount with no meaning.
