## stories

- `Toman`: Type with either keyboard, «۲۵۰۰» and "2500" both work. This is a text input with its own parsing, not `<input type="number">`, which rejects Persian digits outright and would leave the field looking broken to a Persian typist.
- `With Decimals`: Two decimals for USD and USDT, toman has no sub-unit.
- `Accepts A Persian Keyboard`: The whole reason this is not `<input type="number">`. A Persian keyboard types «۱۲۵۰۰۰۰۰»; what reaches the database has to be 12500000, and what the user sees has to stay Persian while they type it.
- `Editing Its Own Formatting Keeps The Number`: The editing round trip, which is where a saved receipt gets silently zeroed. The field renders `Intl`'s output, the user appends a digit to it, and the whole string is parsed again, so the parser has to be able to read the formatter's own separators.
- `Clearing Reports Null Rather Than Zero`: Clearing the field means "no amount", not "zero". The form's validation distinguishes them, and a receipt of 0 toman would save where an empty one must not.
- `Keeps The Decimals Being Typed`: Decimals have to survive being typed. Reformatting «۱۲٫» back to «۱۲» on the keystroke after the point makes the fractional part impossible to enter at all, and the trailing zero of «۱۲٫۵۰» impossible to keep.
- `Zero Is Shown`: A zero is a figure, not an empty field. Only `null` may render blank, otherwise a stored 0 looks like a value the user forgot to enter.
- `Empty`: Nothing typed yet. The field renders blank rather than a zero, because `null` and 0 mean different things to the form's validation.
- `With Error`: The invalid state. The helper line replaces the hint with the reason, so the field says what to do rather than only that something is wrong.
- `Ungrouped`: Ungrouped, for a field where separators would read as part of the value.
- `English Locale`: English mode. Persian numerals are a property of the Persian locale, showing «۱۲٬۵۰۰٬۰۰۰» to an English reader is the bug this hook exists to prevent, and a Persian keyboard still has to be accepted while the interface is English.
