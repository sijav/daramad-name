# Working agreement: درآمدنامه

Instructions for any AI agent (and any human) working in this repo. Written by
Claude at Sina's request, from rules he gave during the build. Read this before
touching anything.

---

## 1. Rules Sina set, that are not negotiable

### Every user-facing string goes through lingui, written in ENGLISH

**Message ids are English. Persian is a translation.** English is the lingui
source locale, so the code contains English strings and
`src/locales/fa-IR/messages.po` holds the Persian. Never write a Persian
string literal in a `.ts`/`.tsx` file.

- Inside a component: `` t`…` `` from `useLingui()` (`@lingui/react/macro`), or
  `<Trans>…</Trans>` for JSX.
- Outside a component (module constants, thrown errors, fixtures): `` msg`…` ``
  from `@lingui/core/macro`, resolved at the call site with `i18n._(descriptor)`.

Enforced by `lingui/no-unlocalized-strings` from `eslint-plugin-lingui`. It
catches **any** unlocalized string, English included, writing a bare English
label fails exactly like a Persian one would. It runs with type information
(`useTsTypes`), so strings assigned to union types (MUI prop unions, `sx`
values, our own enums) are skipped automatically.

Five globs turn the rule off, each for a stated reason in `eslint.config.mjs`:
`src/shared/utils/digits.ts` (codepoint tables), `**/*.test.{ts,tsx}`
(assertions are expected values, not copy), `**/*.stories.{ts,tsx}` (a story
shows one concrete rendering), `src/shared/story-fixtures/**` (sample data that
is never bundled into the app) and `src/shared/story-docs/**` (Storybook
plumbing, whose literals are Vite glob patterns).

After adding strings:

```bash
npm run i18n:extract   # adds the new English ids
# translate them in src/locales/fa-IR/messages.po
npm run i18n:compile
```

The fa-IR catalog must be **100% translated**, the app defaults to Persian, so
a missing translation shows an English string to an Iranian user.

### Documentation lives in markdown, never in the code

Sina, twice: _"putting the doc of the props inside tsx files! it should be
inside stories, there's the place for docs"_, then _"stop adding too much
comments in the code instead of writing in the md files"_.

A `.ts`/`.tsx` file carries code and the short comments that explain the code.
It does not carry documentation prose. Everything a Storybook Docs page prints,
the page description, each prop's description, each story's note, lives in
`src/shared/story-docs/{en,fa}/<slug>.md`. See
[the README there](./src/shared/story-docs/README.md) for the format.

That means: no JSDoc above `const meta`, no docblock above a story export, no
`description:` inside `argTypes`. Add a story and you add two markdown entries,
one per language; `storyDocs.test.ts` fails until you do.

The line to hold: **if it explains the code to whoever edits it, it stays as a
comment. If it explains the component to whoever uses it, it goes in markdown.**
Long "why we built it this way" essays at the top of a file are documentation
and belong in the md, or in TECH-DEBT.md if they explain a workaround.

### Write prose in English in code files

Anything written into a `.ts`/`.tsx` file, comments included, is English.
Persian belongs in the lingui catalog, in `story-docs/fa`, or in `.mdx`.

Two things are not prose and stay: character data (`digits.ts`'s codepoint
tables, `words.ts`'s numeral words) and demo fixture data. Quoting a Persian UI
string inside an English comment is fine, «خطایی رخ داد» is the clearest way to
name the string being discussed.

### No em dashes in documentation, use commas

Sina: _"remove these AI generated dashes from the docs use comma"_. This applies
to every `.md` and `.mdx` file. Persian text takes the Persian comma `،`, not
the Latin one.

The `story-docs` list separator is a colon (``- `prop`: text``) for the same
reason. Check with a Unicode-aware matcher, not a byte-wise `grep`, which compares
bytes and reports false hits inside Persian characters.

### Colour scheme is a runtime setting too

`themePreference` is `light | dark | system`, persisted in Settings.
`AppThemeProvider` owns BOTH colour scheme and direction and builds the theme
via `getTheme(mode, direction)`.

**Never hardcode a colour in a component.** Everything comes from
`theme.palette.*`, which is built from `lightColors` / `darkColors` in
`tokens.ts`. Three components originally hardcoded hex and broke in dark mode
(the Tag warning tone, the InsightCallout dot, the donut ramp), if you need a
colour that is not in the palette, add the role to `ColorPalette` and give it
both light and dark values.

The Figma file defines **light values only**. The dark palette is derived in
`tokens.ts` per MD3 guidance and is labelled as such; replace it wholesale if
the design ever ships real dark tokens.

The PDF is the exception: its colours stay hardcoded light, because a printed
document does not have a dark mode.

### Language is a runtime setting, not a build-time one

The app **defaults to Persian** and the user can switch to English in Settings;
the choice persists in IndexedDB. Switching flips text direction too (`RtlProvider`
swaps the Emotion cache and the MUI theme direction, and sets `dir`/`lang` on
`<html>`).

Numbers and dates follow the locale via `useFormat()` from `src/shared/format`.
**Never call `toPersianDigits` directly in a component**, Persian numerals are
a property of the Persian locale, and hardcoding them shows «۶۴۹,۹۸۰,۰۰۰» to an
English reader. The date picker's Farsi-Digits font is applied on the same
condition.

The PDF report is the one exception: it takes its **own** i18n instance
(`loadReportI18n`), so an English certificate can be produced while the
interface stays Persian.

### Verify versions and docs from source, never from memory

Before installing or writing against any library:

```bash
npm view <pkg> version
npm view <pkg> peerDependencies --json
```

Read the library's current docs. Sina's words: _"forget your own training and do
what I say, read the new docs."_ He has 13 years of experience and has been
burned by confident code written against APIs that no longer exist.

Prefer the latest stable release. If a constraint blocks it, say so explicitly
rather than silently pinning older. Two live examples in this repo:

- **TypeScript is pinned to `~6.0.3`, not 7.x.** `typescript-eslint` declares
  `typescript >=4.8.4 <6.1.0`; TS 7 breaks linting entirely.
- **Versions are capped by `min-release-age=7` in Sina's global `~/.npmrc`**
  npm refuses packages published in the last 7 days as supply-chain protection.
  That is deliberate. Do not override it. If `npm install` reports
  `No matching version found ... with a date before <date>`, that is this
  setting, not a broken package.

### Ask instead of assuming

If something is genuinely ambiguous and the answer changes the work, ask. Sina
would rather answer a question than review a wrong assumption. But do not ask
about things you can determine yourself, and never stop mid-task to wait, ask
inline and keep going.

### Never end a turn to wait for input

Use the question tool. Ending the turn to "wait for confirmation" is not
acceptable.

### No TypeScript escape hatches without asking

No `as X` to paper over a mismatch, no `@ts-ignore`, no `@ts-expect-error`, no
`unknown` casts as a workaround. If the types do not line up, ask what the
correct type is.

### Finish the work

"Provide the MVP as simple as possible with all working application, not a
single task should be TODO or ask me if you should do it." Do the simplest thing
that fully works, then verify it actually works.

---

## 2. Conventions

Derived from Sina's `fix-frontend` and Pipochart projects.

### Structure

```
src/
  core/          singletons: db, i18n, query client, theme
  pages/         one folder per route
  shared/        components, queries, types, utils
  locales/       lingui catalogs (en-US source, fa-IR translation)
  pwa/           install prompt, service-worker registration, icons
```

Only these top-level folders. No others.

Two folders under `shared/` are Storybook-only and never reach the app bundle:

| Folder                  | Holds                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `shared/story-fixtures` | Demo data and the seeding helpers stories share              |
| `shared/story-docs`     | Every Docs page's prose, in `en/` and `fa/`, plus the loader |

### Imports

- Every folder with more than one file has an `index.ts` barrel.
- Cross-module imports target the barrel: `src/shared/money-text`, never
  `src/shared/money-text/MoneyText`. Exceptions: `types/*`, `layouts/*`,
  `utils/*`.
- No relative parent imports (`../`). Absolute `src/...` always.
- Never import from `'.'`, use `'./Component'`.
- MUI from the top-level barrel only: `import { Button } from '@mui/material'`.

### Browser globals

Through `window.*`, `window.localStorage`, `window.crypto`, `window.fetch`.
Keeps them mockable and greppable. Enforced by `no-restricted-globals`.

### Data layer naming

The function name mirrors the file name:

| File                        | Export                                 |
| --------------------------- | -------------------------------------- |
| `getLedger.query.ts`        | `getLedgerQuery` + `getLedgerQueryKey` |
| `createReceipt.mutation.ts` | `createReceiptMutation`                |

- Queries take a `QueryFunctionContext` typed to their key tuple.
- Mutations take a single object payload.
- Query keys are exported: `xQueryKey` when constant, `getXQueryKey` when a function.
- Mutations live where they are used; children own their own mutations and
  invalidate, rather than parents passing handlers down.
- Never export hooks from query files.

### Style

Prettier: single quotes, no semicolons, width 140, organize-imports plugin.
`npm run format`. ESLint must pass with zero warnings.

### Components

- Build on MUI primitives, do not hand-roll what `ToggleButtonGroup`, `Chip`
  or `DatePicker` already does correctly, including keyboard and a11y.
- Every component gets a story. Sina's note: _"that was supposed to be there
  before you create component"_, write the story first from now on.
- Pages hold no styling. They call components with props.

### Stories render from their args

_"all the controls are there (that is taken from props all props should have
proper controls in the stories)"_. A Docs page exists to demonstrate a component
through its props, so the Controls panel has to actually drive what is on
screen.

The anti-pattern this repo had, in seven files: `args: { title: '' }` beside a
`render: () => <SomeView />` that ignored args completely. The panel looked
alive and moved nothing.

- Spread args and fall back per field: `title={args.title || t`Ledger`}`. That
  keeps the sample copy following the Language toolbar while a typed-in value
  wins.
- Every callback prop gets an `fn()` so the Actions panel records it and a play
  function can assert on it. No `argTypesRegex`, see the note in `preview.tsx`.
- A story that composes several instances (a gallery, a row of four different
  cards) has no single component to drive. Either spread args across all of
  them, or set `parameters: { controls: { disable: true } }` and say why. An
  empty panel is honest; a dead one is not.
- `argTypes` carries the control SHAPE only: `control`, `options`,
  `table.disable`. Descriptions live in markdown.

### Story fixtures are shared, not per story

A Docs page renders every story of its component at once, so several stories
call `seedDatabase` simultaneously. Concurrent callers await one in-flight seed
and the tables are only emptied once the last holder releases; writes use
`bulkPut` so a re-seed is idempotent. Getting this wrong produced
`receipts.bulkAdd(): 8 of 8 operations failed. ConstraintError` on every Docs
page, from clear/write runs interleaving.

### Panel treatments (verified against Figma, do not guess these)

Every panel is a flat `surface-default` fill with a 1px `border-default`
hairline. There is **no glass**: the frosted 28px card came from an older
revision and was removed. Radius and shadow vary by screen, and the Figma file
is genuinely inconsistent, match it per screen rather than unifying:

| Screen                                                               | Radius                          | Shadow      |
| -------------------------------------------------------------------- | ------------------------------- | ----------- |
| Dashboard, summary cards, chart panels, recent receipts, top clients | 20 (`xl`)                       | Elevation/1 |
| Dashboard, report shortcut                                           | 20, `brand-primary-subtle` fill | none        |
| Charts page, the componentised `Chart/*` panels                      | 16 (`lg`)                       | none        |
| Quick Entry, the income form                                         | 20                              | Elevation/1 |
| Quick Entry, support panels beside it                                | 16                              | Elevation/1 |
| Ledger, table panel                                                  | 20                              | none        |
| Report, config and document                                          | 16                              | none        |
| Settings, every section                                              | 16                              | none        |

`SurfaceCard` takes `radius`, `tone` and `flat` to express all of these.
`ChartCard`'s `variant` picks between the two chart treatments. `StatTile` is
NOT a card, it is the nested `surface-subtle` figure box (radius 12, no border,
no shadow) used inside the report document; a standalone figure is a
`SummaryCard`.

Only the fixed app chrome (top bar, bottom nav) is translucent, at
`blur(12px)`, that is what `glassSurface`/`glassBlur` are for. Nothing else
may blur; a global `MuiPaper` backdrop-filter once leaked it into every menu
and dialog in the app.

Figma file key `yW364nD8qVYhXKiOxNBShA`, canvas `11:13` "Screens · Desktop".
Screen frames: Dashboard `152:516`, Quick Entry `173:709`, Ledger `253:817`,
Charts `351:547`, Report `355:694`, Settings `359:760`.

`get_metadata` with no `nodeId` only lists the Cover page, it does NOT list the
screens canvas. Go straight to `11:13` or a known frame id instead.

### Column order in RTL

The design is laid out RTL, so a panel on the **left** of a Figma frame must
come **second** in the DOM, and one on the right comes first. Read the frame's
child `x` coordinates from `get_metadata` and order the JSX accordingly, do not
eyeball it from the screenshot. This caught four separate rows: the dashboard's
two content rows, the charts row, and both summary-card strips.

### Two dependencies are pinned on purpose

- **`stylis` at 4.2.0**, the copy `@emotion/cache` bundles. Emotion walks the
  element tree with its own stylis, so handing it a `prefixer` from a different
  version yields elements it cannot lift and crashes on every `::placeholder`
  rule in the app. `@mui/stylis-plugin-rtl` wants 4.4.0; the `overrides` entry
  holds everything at 4.2.0. Do not bump it without checking what emotion ships.
- **`typescript` at 6.0.3**, typescript-eslint's peer range is `<6.1.0`.

Run `npm outdated` when picking up work; everything else is free to move,
subject to the 7-day release-age cap.

### Styling belongs in the theme

If a component needs an `sx` to match the design, ask whether the THEME should
carry it instead. `MuiTableCell`, `MuiTableSortLabel` and the input placeholder
tone all live in `theme.ts` for that reason, the ledger table styles no cells
at all, it only marks the two places the design deliberately departs.

`SurfaceCard`'s default padding is responsive, so `sx={{ p: 0 }}` loses to its
own `@media` rule. Use `disablePadding` instead.

### Date ranges collapse

A range writes its shared parts once: same year prints the year only on the
closing date, and same month drops the month from the opening one too:
«۱ فروردین تا ۲۹ اسفند ۱۴۰۵»، «۱ تا ۲۹ اسفند ۱۴۰۵». Only a range that actually
crosses a boundary spells both ends out. Use `useFormat().dateRange`, never two
`dateLong` calls with a dash between them.

### Two blues

`--brand-primary` (#3460d6) is for filled buttons, bars and links.
`--md-sys-color-primary` (#3b6ef5) is for chips, segments and the nav rail.
They are NOT interchangeable; MUI's `primary.main` is the latter, so filled
buttons are themed through a `variants` entry rather than the palette.

---

## 3. What this app is

Local-first income ledger for Iranian freelancers. Seven pages: dashboard (the
landing route), quick entry, ledger, charts, report, settings, and certificate, which is
the printable document the report links out to. Six scenarios in `PHASE-NEXT.md`
and `README.md` (Persian: `README.fa.md`).

**There is no backend, deliberately.** Every scenario runs in the browser;
exchange rates are typed by hand, there is no login, and transfer between
devices is a JSON file the user downloads. A server would have contradicted the
privacy line in the footer, which is literally true as written.

### Decisions that look odd but are load-bearing

**`amountToman` is computed once on write and stored.** Never recompute it on
read. If Tether moves, a past receipt must not change, that number is what the
freelancer actually received. `computeToman` is the only place it is calculated.

**Backdated receipts relabel the rate field.** Scenario 1 says "today's rate";
scenario 5 backdates two months. Naively combined, that freezes today's rate
onto an old receipt and is silently wrong forever. `useReceiptForm` exposes
`isBackdated`; the form relabels and warns.

**Monthly average divides by months elapsed, not months with income.** An
embassy reads it as "what does this person earn monthly". Dividing by only
productive months inflates it and misrepresents the applicant.

**Backup restore replaces, never merges.** Merging needs a "same receipt" rule
that does not exist, and restoring one file twice would silently double the
user's income, the worst possible failure for a tool whose whole value is an
accurate total.

**English strings are longer than Persian.** The `StatTile` figure uses a
container query and wraps, because "649,980,000 Toman" overflows a tile that
"۶۴۹,۹۸۰,۰۰۰ تومان" fits. Check both locales before calling a layout done.

**Persian digits in the date picker come from a font, not the adapter.** MUI X
measures field sections with `formatByString(...).startsWith('0')` against ASCII
`'0'`. An adapter returning Persian digits makes the picker throw. Vazirmatn's
Farsi-Digits cut draws ASCII 0-9 with Persian glyphs, so the DOM stays ASCII and
the user sees Persian. The inner `.MuiPickersSectionList-sectionContent` spans
carry their own `font-family` and must be targeted explicitly, inheriting from
the root is not enough.

**`muiPalette.d.ts` is not named `theme.d.ts`.** A `.d.ts` beside a same-named
`.ts` is treated by TypeScript as that file's generated declaration output and
silently dropped from the program. The augmentation vanishes with no error.

**The PDF is drawn with pdfkit, and its constructor takes two non-obvious
options.** `font: false`, otherwise pdfkit reads Helvetica's AFM metrics with
`fs.readFileSync` while constructing the document, which has no file to read in
the browser and throws "readFileSync of null". `compress: false`, pdfkit's
compression path calls Node's `deflateSync`, which the browser zlib shim does
not implement; pdfkit already subsets the embedded font, so an uncompressed
certificate is still small. Both are set in `renderCertificatePdf.ts`, and
pdfmake, which the report was drawn with before, is no longer a dependency.

---

## 4. Commands

```bash
npm run dev            # http://localhost:5173
npm run storybook      # http://localhost:6006
npm run lint           # zero warnings allowed
npm run lint:tsc
npm test
npm run build
npm run i18n:extract   # after adding strings
npm run i18n:compile
```

Package manager is **npm**. There is no yarn.lock and no workspace.

---

## 5. Before saying you are done

1. `npm run lint`, zero warnings.
2. `npm run lint:tsc`, clean.
3. `npm test`, passing.
4. `npm run build`, succeeds.
5. **Actually run it.** Open the app or the story and look at the rendered
   result. A computed style is not proof: the Persian-digit bug above passed a
   `getComputedStyle` check on the root element while still rendering Latin
   digits in the child spans. Only a screenshot caught it.
6. **Check all four combinations.** Storybook has Language and Theme toolbars;
   a change is not done until it has been seen in fa-IR/light, fa-IR/dark,
   en-US/light and en-US/dark. English strings are longer than Persian and the
   direction flips, so layout bugs hide in exactly one of the four.
7. **Read the Docs page in both languages.** Not just the stories, the page:
   the description, the Controls table and every story heading below it. A page
   that is Persian at the top and English once you scroll is the failure mode
   here, and it is invisible from the Canvas tab.
8. Report honestly. If something is partial, say which part.

### Do not verify by inference

Two rules, both learned the hard way on this repo.

**Test the thing in front of you, not a thing like it.** `Shared/Tag` was
checked in both languages and the mechanism declared working; the page actually
open was `App`, which had no translated stories and read English from the second
heading down. Open the page being asked about.

**A tool that finds nothing has not proved anything.** Two scripted sweeps here
reported clean while being broken: a greedy regex that matched the first `/**`
in a file and bled one story's prose into every story below it, and a
a byte-wise `grep` for dashes that compares bytes and both misses real hits and invents others
inside Persian text. When a check comes back empty, confirm it can find a case
you plant by hand.

## Suppressions and workarounds

Nothing gets silenced without an entry in [TECH-DEBT.md](./TECH-DEBT.md): what
is suppressed, what causes it, what would fix it, and the check that tells you
it can be removed. That covers lint disables, ignore patterns, CLI flags that
hide output, pinned or held-back versions, raised resource limits, widened test
timeouts, and anything routed around rather than fixed.

A suppressed warning with no record is a decision nobody can revisit, the
reason is the first thing lost. "Nothing to do right now" is the reason to
write it down, not to skip it.

Deliberate scope cuts go in PHASE-NEXT.md instead. Those are decisions, not debt.
