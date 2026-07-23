## props

- `title`: The page name. Left blank, each story falls back to its translated sample.
- `subtitle`: One line under the title, saying what the page is for.
- `meta`: The design’s third line, when the figures were last updated.
- `action`: Trailing slot: the report-range pill and the record button live here.

## stories

- `Title Only`: A page whose name says everything: Settings needs no second line.
- `With Subtitle`: The common shape, a title, and a line saying what the page is for.
- `With Meta Line`: The third line, which only the report uses. When a document was generated matters to whoever receives it, so the page states it rather than leaving the reader to guess how fresh the figures are.
- `With Action`: The action slot holds the year picker on the charts and report pages.
