## props

- `onValueChange`: Fires on every keystroke, with `null` while the field is empty.
- `value`: The amount, or `null` for an empty field, which is not the same as zero.
- `label`: The caption above the field.
- `helperText`: What is wrong, or what the field expects.

## stories

- `Toman`: Toman has no sub-unit, so no decimals are accepted.
- `Tether`: Tether and USD carry two decimals. The field takes its decimal count from the currency, so a Tether amount keeps its cents, dropping them here would silently round every foreign receipt to a whole unit before the rate is even applied.
- `Dollar`: The third currency, so every member of the union has a rendered unit label.
- `Empty`: Empty state, the placeholder box keeps its full height so the form does not jump.
- `Invalidated`: The reason, not just a red outline, a colour alone says nothing about what to do next.
