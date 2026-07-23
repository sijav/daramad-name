## props

- `months`: All twelve buckets, including the empty ones, a missing month would hide the gap.
- `calendar`: Names the months. A Jalali year starts at Farvardin, a Gregorian one at January.

## stories

- `With Empty Months`: Every month is plotted, including the empty ones. Mordad here is a zero bar, not a missing column, dropping empty months would compress the axis and hide exactly the gap a freelancer needs to see. The bars are the only text alternative the chart has, so they are read here rather than looked at: twelve of them, each named, and the quiet ones saying they are quiet instead of announcing a bare zero.
- `Left To Right`: The same year read left to right. The DOM order flips with it, which is the point: the reversal is done in the markup, not with `direction: ltr`, because the stylis RTL plugin would mirror that straight back.
- `Gregorian`: The same twelve buckets named for a Gregorian year, which starts at January rather than Farvardin. The calendar names the months; it does not re-bucket the data.
- `Full Year`: A year with income every month.
- `Single Month`: The first-month case: a single bar must not blow out the axis.
