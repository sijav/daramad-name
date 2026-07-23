# Changelog

Notable changes to DaramadName. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Pre-1.0, so the public surface may still move. `alpha` sorts before `beta`,
which is the point: everything works, but nothing has been through a beta.

## [Unreleased]

Nothing yet.

## [0.1.0-alpha.1] - 2026-07-23

The MVP. Every scenario in the brief works end to end.

### Added

- **Quick entry.** Record a receipt in under 15 seconds: today's date, the last
  channel used, and an autofocused amount field, so the fast path is type, tab,
  save. A non-Toman receipt reveals the rate field and a live Toman equivalent.
- **The ledger.** Search, a filter popover with removable chips, sorting,
  pagination, a row-actions menu and a details drawer. The total tracks the
  active filter rather than the visible page.
- **The income certificate.** A presentable A4 document in Persian or English,
  built from one model shared by the on-screen preview and the PDF, so the two
  cannot say different things. The English version can be produced from a
  Persian interface, because it is for the embassy, not the screen.
- **Charts.** A 12-month income chart that keeps empty months as zero bars, a
  client-share donut, and a dependency warning above 50% concentration.
- **Dashboard.** Summary tiles, the year chart, client share, the latest
  receipts and a shortcut to the report.
- **Backup and restore.** A JSON file is how a ledger moves between devices,
  which is what makes having no backend workable. Restore validates every row
  before it replaces anything.
- **Installable as a PWA**, with an offline service worker.
- **Persian and English throughout**, switchable at runtime, with the direction,
  numerals and calendar following the choice.

### Notable behaviour

- **The Toman value is frozen on write.** A foreign-currency receipt stores the
  rate typed and the Toman figure computed from it, once. Nothing recomputes it
  on read, so a later rate change cannot restate what was earned last month.
- **A backdated receipt relabels the rate field** to "the rate on that date",
  because today's rate frozen into a two-month-old receipt is wrong forever and
  nothing downstream can detect it.
- **The monthly average divides by the months in the period**, not by the months
  with income, and prints its own divisor so the figure can be checked.
- **Restore replaces rather than merges.** Merging needs a definition of "the
  same receipt" that does not exist, and restoring twice would silently double
  someone's income.

### Documentation

- Every Storybook Docs page is written in English and Persian: the page
  description, each prop, each story's note, and the story headings, which read
  «کانال (Channel)». It follows the Language toolbar.
- Documentation lives in markdown under `src/shared/story-docs/`, not in the
  source. `storyDocs.test.ts` fails if the two sides drift apart.
- `AGENTS.md` carries the working agreement, `TECH-DEBT.md` every suppression
  with the check that says when it can go, `PHASE-NEXT.md` the deferred scope.

### Known limits

- No backend, so the certificate cannot be verified against an issuer. This is
  the one capability the architecture gives up, and it is recorded in
  `PHASE-NEXT.md`.
- Story files run one at a time; parallel is faster but still races on the
  shared IndexedDB. See `TECH-DEBT.md` entry 2.
- One axe rule, `role-img-alt`, is off on the chart stories, because MUI X
  leaves its accessibility proxy unnamed at rest. Entry 7.

[unreleased]: https://github.com/sijav/daramad-name/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/sijav/daramad-name/releases/tag/v0.1.0-alpha.1
