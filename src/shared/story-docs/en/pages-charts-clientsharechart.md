## props

- `shares`: Ranked clients. The arc order follows the array, not the values.
- `limit`: Rows past this fold into a single "others" slice.

## stories

- `Balanced`: Balanced book, no single client dominates, so no warning appears.
- `Concentrated`: Above 50% the dependency warning fires; shown with the callout it explains.
- `Single Client`: A single client, the extreme concentration case.
- `Many Clients`: More clients than legend rows: the tail folds into one "others" slice. Asserted rather than described. `foldOthers` could return its input unchanged and the story would still draw a donut and a legend, the only visible sign would be two extra rows nobody counted.
- `No Clients`: No clients at all. The dashboard passes `shares={shareData?.shares ?? []}`, so this reaches the component in production, and it divides by the total, which is zero here, and reads `rows[0]` for the figure in the hole.
