# Working agreement — درآمدنامه

Instructions for any AI agent (and any human) working in this repo. Written by
Claude at Sina's request, from rules he gave during the build. Read this before
touching anything.

---

## 1. Rules Sina set, that are not negotiable

### Every user-facing string goes through lingui

No exceptions. Not in components, not in constants, not in error messages, not
in seed/sample data, not in a "quick script".

- Inside a component: `` t`…` `` from `useLingui()` (`@lingui/react/macro`), or
  `<Trans>…</Trans>` for JSX.
- Outside a component (module constants, thrown errors, fixtures): `` msg`…` ``
  from `@lingui/core/macro`, resolved at the call site with `i18n._(descriptor)`.

This is enforced mechanically — `no-restricted-syntax` in `eslint.config.mjs`
fails the build on any Persian string literal, bare Persian JSX text, or
untagged Persian template literal. Three files are exempt, each for a stated
reason: `digits.ts` (codepoint tables, not copy), `*.test.ts` (assertions),
`*.stories.tsx` (fixtures). Do not add exemptions without a reason that good.

After adding strings: `npm run i18n:extract`, then translate in
`src/locales/en-US/messages.po` if the string can appear in the English PDF.

### Verify versions and docs from source, never from memory

Before installing or writing against any library:

```bash
npm view <pkg> version
npm view <pkg> peerDependencies --json
```

Read the library's current docs. Sina's words: *"forget your own training and do
what I say, read the new docs."* He has 13 years of experience and has been
burned by confident code written against APIs that no longer exist.

Prefer the latest stable release. If a constraint blocks it, say so explicitly
rather than silently pinning older. Two live examples in this repo:

- **TypeScript is pinned to `~6.0.3`, not 7.x.** `typescript-eslint` declares
  `typescript >=4.8.4 <6.1.0`; TS 7 breaks linting entirely.
- **Versions are capped by `min-release-age=7` in Sina's global `~/.npmrc`** —
  npm refuses packages published in the last 7 days as supply-chain protection.
  That is deliberate. Do not override it. If `npm install` reports
  `No matching version found ... with a date before <date>`, that is this
  setting, not a broken package.

### Ask instead of assuming

If something is genuinely ambiguous and the answer changes the work, ask. Sina
would rather answer a question than review a wrong assumption. But do not ask
about things you can determine yourself, and never stop mid-task to wait — ask
inline and keep going.

### Never end a turn to wait for input

Use the question tool. Ending the turn to "wait for confirmation" is not
acceptable.

### No TypeScript escape hatches without asking

No `as X` to paper over a mismatch, no `@ts-ignore`, no `@ts-expect-error`, no
`unknown` casts as a workaround. If the types do not line up, ask what the
correct type is.

### Finish the work

"Provide the MVP as simple as possible with all working application — not a
single task should be TODO or ask me if you should do it." Do the simplest thing
that fully works, then verify it actually works.

---

## 2. Conventions

Derived from Sina's `fix-frontend` and Pipochart projects.

### Structure

```
src/
  core/          singletons — db, i18n, query client, theme
  pages/         one folder per route
  shared/        components, queries, types, utils
  locales/       lingui catalogs (fa-IR source, en-US)
```

Only these top-level folders. No others.

### Imports

- Every folder with more than one file has an `index.ts` barrel.
- Cross-module imports target the barrel: `src/shared/money-text`, never
  `src/shared/money-text/MoneyText`. Exceptions: `types/*`, `layouts/*`,
  `utils/*`.
- No relative parent imports (`../`). Absolute `src/...` always.
- Never import from `'.'` — use `'./Component'`.
- MUI from the top-level barrel only: `import { Button } from '@mui/material'`.

### Browser globals

Through `window.*` — `window.localStorage`, `window.crypto`, `window.fetch`.
Keeps them mockable and greppable. Enforced by `no-restricted-globals`.

### Data layer naming

The function name mirrors the file name:

| File | Export |
|---|---|
| `getLedger.query.ts` | `getLedgerQuery` + `getLedgerQueryKey` |
| `createReceipt.mutation.ts` | `createReceiptMutation` |

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

- Build on MUI primitives — do not hand-roll what `ToggleButtonGroup`, `Chip`
  or `DatePicker` already does correctly, including keyboard and a11y.
- Every component gets a story. Sina's note: *"that was supposed to be there
  before you create component"* — write the story first from now on.
- Pages hold no styling. They call components with props.

---

## 3. What this app is

Local-first income ledger for Iranian freelancers. Five pages: quick entry,
ledger, charts, report, settings. Six scenarios in `PHASE-NEXT.md` and
`README.md`.

**There is no backend, deliberately.** Every scenario runs in the browser;
exchange rates are typed by hand, there is no login, and transfer between
devices is a JSON file the user downloads. A server would have contradicted the
privacy line in the footer, which is literally true as written.

### Decisions that look odd but are load-bearing

**`amountToman` is computed once on write and stored.** Never recompute it on
read. If Tether moves, a past receipt must not change — that number is what the
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
user's income — the worst possible failure for a tool whose whole value is an
accurate total.

**Persian digits in the date picker come from a font, not the adapter.** MUI X
measures field sections with `formatByString(...).startsWith('0')` against ASCII
`'0'`. An adapter returning Persian digits makes the picker throw. Vazirmatn's
Farsi-Digits cut draws ASCII 0-9 with Persian glyphs, so the DOM stays ASCII and
the user sees Persian. The inner `.MuiPickersSectionList-sectionContent` spans
carry their own `font-family` and must be targeted explicitly — inheriting from
the root is not enough.

**`muiPalette.d.ts` is not named `theme.d.ts`.** A `.d.ts` beside a same-named
`.ts` is treated by TypeScript as that file's generated declaration output and
silently dropped from the program. The augmentation vanishes with no error.

**pdfmake 0.3 uses `addVirtualFileSystem()` / `addFonts()`.** Assigning
`pdfMake.vfs` (the 0.2 API) does nothing and fails later with
"File not found in virtual file system".

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

1. `npm run lint` — zero warnings.
2. `npm run lint:tsc` — clean.
3. `npm test` — passing.
4. `npm run build` — succeeds.
5. **Actually run it.** Open the app or the story and look at the rendered
   result. A computed style is not proof: the Persian-digit bug above passed a
   `getComputedStyle` check on the root element while still rendering Latin
   digits in the child spans. Only a screenshot caught it.
6. Report honestly. If something is partial, say which part.
