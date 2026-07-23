Every number and date the app prints goes through `useFormat`. These stories
exercise all of it at once, because the failure worth catching is one surface
drifting from the others, not the hook being broken outright.

## stories

- `Persian`: Persian: Persian numerals, the Arabic separators, and the Jalali calendar.
- `English`: English mode, and the reason this hook exists at all: Persian numerals are a property of the Persian locale, not of the app. «۶۴۹,۹۸۰,۰۰۰» in front of an English reader shipped as a live bug, because a component reached past the hook and called `toPersianDigits` itself. The calendar stays Jalali here on purpose: the calendar system is a separate setting from the language, so an English interface must still be able to print «10 Mordad 1405» rather than switching to Gregorian behind the user.
