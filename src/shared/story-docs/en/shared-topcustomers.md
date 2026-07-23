The ranked client list beside the donut, in the card it always sits in.

`shares` is a live object control: add a row, change a figure, or push the
list past `limit` and the fold appears. The label for the folded row comes
from the catalog so it follows the Language toolbar, and anything typed into
Controls overrides it.

## props

- `shares`: Ranked clients. The component does not sort, it prints what the query ordered.
- `othersLabel`: The folded row’s name. Passed in rather than translated inside, so the caller owns the wording.

## stories

- `Ranked`: Complements the donut: legible at any share, with exact figures beside each name.
- `With Others`: Anything past the limit folds into an "others" row rather than being dropped.
- `Long Name`: A long client name must truncate rather than push the figure off the row.
