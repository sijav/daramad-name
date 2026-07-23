## props

- `prefix`: Prefixed to the selected label, e.g. "Report range: year 1403".
- `onSelect`: The chosen value, always as a string: it arrives from a DOM select.
- `options`: Every choice, in the order they should appear. Newest first, for years.

## stories

- `Default`: The pill in every page header, chevron on the trailing edge, label inline.
- `Is Named For Screen Readers`: The pill has no label above it, and `role="combobox"` does NOT take its name from the text inside it, so the control announced nothing at all, which axe reports as `aria-input-field-name` (serious). `prefix` is already the label the design prints in the pill, so it names the control too and the visible text cannot drift away from the spoken one.
- `Shows The Composed Label And Reports The Choice`: The pill prints `prefix: label`, not the raw value. The distinction is the whole point of `renderValue`: the year is stored as 1403 and shown as ۱۴۰۳, so a control that fell back to the value would print Latin digits in the middle of a Persian header.
