## props

- `receipts`: The rows for the current page, in the order the query returned them.
- `summary`: Totals for the WHOLE filtered set, not just this page, the brief requires the total to track the filter.
- `sort`: Which column is sorted and which way, so the header can show its arrow.
- `filtered`: Drives the total row's wording, "filtered" is a lie when nothing is.
- `onSortChange`: The page owns the sort; the header only reports the press.
- `onView`: Opens the details drawer for that row.
- `onEdit`: Opens the edit dialog for that row.
- `onDelete`: Asks to delete. The confirmation belongs to the page.

## stories

- `Default`: Mixed currencies, each showing its original amount beside a frozen toman equivalent. The totals row lives inside the same table so it can never scroll out of sync with the rows it sums.
- `Sorted By Amount`: Sorted by amount, clicking a column header toggles direction.
- `Single Row`: A filtered view that matched a single receipt; the total tracks the filter.
- `Total Describes The Summary Not The Visible Rows`: The total describes the whole filtered set, not the page. This row once read "total of 25 receipts" above the sum of the 100 that were actually matched, a number a freelancer would copy onto a visa application. So the story deliberately hands the table a two-row PAGE alongside a summary for 25 receipts, and asserts the row reports the summary rather than what it can see.
- `Unfiltered Total Does Not Claim To Be Filtered`: "Filtered" is a claim about the data. Printing it on an unfiltered ledger tells the user rows are being withheld and sends them looking for a filter that was never applied.
- `Header Clicks Toggle Sort Correctly`: The sort toggle rule: a NEW column starts descending (newest / largest first, which is what someone opening a ledger wants), and only re-clicking the column already in use flips it to ascending. Getting this backwards makes the first click on "amount" show the five smallest receipts.
- `Total Row Spans Match The Header On A Phone`: Narrow screens drop columns, and the total row's label spans "everything before the Toman figure" via a COMPUTED colSpan. Hard-code it and the total row ends up wider or narrower than the header, which silently stretches the whole table sideways on the one screen size that cannot afford it. So this asserts the invariant directly: the total row's spans must add up to the header's cell count, at a phone width where three of the six columns are gone.
