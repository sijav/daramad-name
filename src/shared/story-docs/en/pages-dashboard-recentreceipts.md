## props

- `receipts`: Newest first, already sliced by the caller, this list does not paginate.

## stories

- `With Receipts`: Date, client, channel, what arrived and what it is worth in Toman. The last two columns are the ones worth checking: a foreign receipt has to show BOTH the 500 Tether that was received and the 49,250,000 Toman it was frozen at. Showing one without the other, or the same figure twice, is a misreport on the first screen the user sees, and this panel is exactly where someone looks to confirm a receipt landed correctly.
- `Empty`: A range with nothing in it. The panel says so in a sentence instead of drawing a header row over empty space: an empty table reads as a component that failed to load, and on a page about someone's income "failed to load" and "you earned nothing" are not interchangeable.
