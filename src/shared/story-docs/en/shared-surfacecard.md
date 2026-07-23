## props

- `flat`: Drops the Elevation/1 shadow. The design omits it on Ledger, Report and Settings.
- `disablePadding`: Removes the padding for cards whose child paints edge to edge, the ledger table, whose header band has to reach the rounded corners. A prop rather than `sx={{ p: 0 }}`: the default padding is responsive, so a scalar override loses to its own `@media` rule and the padding stays.
- `radius`: `xl` (20px) for a screen's primary panel, `lg` (16px) for the supporting ones. The design draws this distinction on every screen: the Quick Entry form is 20 while the three panels beside it are 16.
- `tone`: `subtle` is the `brand-primary-subtle` tint the design uses for callouts and the dashboard's report shortcut.

## stories

- `Default`: The design's panel: `surface-default`, a 1px hairline, 20px, Elevation/1.
- `Supporting`: `radius="lg"` is the 16px supporting panel, Settings, Report, Quick Entry's aside.
- `Flat`: `flat` drops the shadow. Ledger, Report and Settings panels carry none.
- `Subtle`: `tone="subtle"` is the tinted panel behind the dashboard's report shortcut.
- `Edge To Edge`: `disablePadding` is how the ledger table reaches the rounded corners, and it is a PROP rather than `sx={{ p: 0 }}` for a reason worth seeing: the default padding is responsive, so a scalar override loses to its own `@media` rule and the header band stops short of the corner at every breakpoint.
