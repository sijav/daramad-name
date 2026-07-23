## props

- `onPageSizeChange`: A new size, with the caller responsible for putting the view back on page 1.
- `onPageChange`: The page owns the position; this control only reports the press.
- `totalCount`: Rows across every page, the "N of M" line, not just what is on screen.
- `pageSize`: Rows per page. Changing it resets to page 1, since the old page may not exist.
- `pageCount`: How many pages there are. The control hides itself when there is only one.
- `page`: The current page, 1-based, the way MUI's `Pagination` counts.

## stories

- `Many Pages`: The row-range sentence matters: a page number alone does not say whether the filter matched 12 receipts or 126.
- `Single Page`: One page of results, where the control has nothing to navigate and says so by getting out of the way.
- `No Results`: Zero results still renders, so the control does not vanish under an empty filter.
- `Row Range Follows The Page`: The row-range sentence is arithmetic, and arithmetic that is quietly off by a page is the kind of thing nobody reports: the table still shows rows, they are just described wrongly. Both ends are checked on a middle page and on the last one, where `lastRow` has to clamp to the total rather than run to 150.
- `Changing Rows Per Page Reslices`: Changing rows-per-page has to actually re-slice the range. It also proves the select reports a NUMBER: `Number(event.target.value)` is the only thing standing between the option and a string page size, and `"10"` would make every downstream `page * pageSize` produce garbage.
- `Empty Range Reads Zero`: An empty result set must read "0 to 0", not "1 to 0". The guard is a single ternary and its absence produces a sentence that claims a row exists.
