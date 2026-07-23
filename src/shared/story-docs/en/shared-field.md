The design's `Field`: the label sits ABOVE the control, not as a MUI floating
label inside the outline. Every input in the design uses this treatment, so
it is a wrapper rather than a per-field style override, labels stay readable
at rest, which is what makes the 15-second entry path scannable.

Each story spreads its args and falls back per field, so the sample copy
follows the Language toolbar while anything typed into Controls wins.

## props

- `label`: The caption above the control. Blank falls back to the story’s translated sample.
- `helperText`: Sits under the control, in the error colour when `error` is set.
- `error`: Turns the helper text red. The control itself is styled by its own `error` prop.
- `fullWidth`: Stretches the wrapper; off, it shrinks to the control’s own width.
- `labelId`: Put on the label text, for a control a `<label>` cannot name, MUI X’s picker renders a `role="group"`.
- `children`: The control being labelled.

## stories

- `Default`: A plain text control, which is what most of the entry form is.
- `Invalid`: The helper text turns red and sits under the control rather than shifting it.
- `With Multiline`: A multiline control opts out of the fixed 52px height so notes can grow.
- `Names Its Control`: The wrapper is the `<label>`, which is what gives the control its name. It used to be a sibling `<Typography component="label">` with no `htmlFor`, associating nothing: every input in the app computed an EMPTY accessible name. The caption is also asserted NOT to be a heading, MUI maps the `subtitle2` variant onto `<h6>`, so a field label would otherwise publish itself as one.
- `Names A Multiline Control`: A multiline control is named by the same wrapper, the `<label>` reaches a `<textarea>` exactly as it reaches an `<input>`.
