## props

- `message`: The sentence. Blank falls back to the story’s translated sample; the component never wraps it in a heading.
- `tone`: `warning` names a risk worth acting on; `info` explains how something works. Neither is an error.

## stories

- `Client Concentration`: Fires above 50% client concentration, a risk worth naming, not an error. A whole percent, because the legend beside it prints one: a callout reading «۷۳٫۲٪» next to a slice labelled «۷۳٪» is the mismatch `getClientShares` rounds to avoid.
- `Info`: The informational tone, in a column narrow enough to wrap the sentence. That wrap is the layout the component is built around: the row is `flex-start` aligned and the dot carries a 6px block start so it sits on the first line of text rather than centring itself against the whole paragraph.
