## props

- `title`: The panel heading. Left blank, each story falls back to its translated sample.
- `subtitle`: A line under the title saying what the figures cover.
- `variant`: `chart` is the Charts page treatment, 16px, no shadow. `content` is the dashboard’s, 20px with Elevation/1.
- `action`: A control aligned opposite the title, such as a link to the full page.
- `children`: The chart, or whatever the panel is wrapping.

## stories

- `Title Only`: The Charts page treatment: a heading and the panel, nothing else.
- `With Subtitle`: The second line, for a panel whose figures need their range stated.
- `Content`: The dashboard's treatment: 20px and Elevation/1, for a panel among cards rather than among charts.
- `With Action`: The `action` slot: a control aligned opposite the title, which on the dashboard is «مشاهده همه» out of the latest-receipts panel. It sits in the title row, so a long English title has to wrap around it rather than push it off the card.
