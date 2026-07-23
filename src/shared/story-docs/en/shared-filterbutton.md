## props

- `activeCount`: How many filters are currently applied; drives the badge.

## stories

- `No Filters`: The resting state, and the one the ledger opens in. No badge at all, because a badge is the only thing that says a filter is applied.
- `Two Active`: The badge carries state the popover hides once it is closed.
- `Many Filters`: Two digits in a 20px circle. The ledger applies at most three filters today, but `activeCount` is a plain number on a shared control, «۱۲» has to stay inside the disc rather than stretch it into an oval the first time a fourth field or another surface pushes the count past one glyph.
- `Disabled`: Disabled while the ledger has nothing to filter.
- `Badge Tracks The Count`: The badge is the ONLY evidence that a filter is applied once the popover is closed, so both of its states are load-bearing: a badge at zero says the ledger is filtered when it is not, and a missing badge at two says the opposite. Either way the user misreads how much they earned. The count also goes through `digits()`, so in Persian it must read «۲», a Latin "2" here would be the one Latin numeral on the toolbar.
- `No Badge When Nothing Is Applied`: No filters applied means no badge at all, not a badge reading zero.
- `Pressing It Opens The Popover`: Opening the popover is the one thing this button does. Nothing else on the ledger toolbar reaches the filter state, so a press that does not report leaves the user with a control that looks alive and changes nothing.
