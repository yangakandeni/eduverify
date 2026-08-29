# Welcome to EduVerify

This guide is for a new engineer with no prior context on this repo. It gets
you from "never seen this codebase" to "can safely ship a change" — with the
domain jargon explained, the landmines flagged, and pointers to the deeper
docs once you need them.

Read this once, top to bottom, before writing code.

## What EduVerify actually does

EduVerify lets someone check whether a South African college, university, or
training provider is **legitimate** — registered with the government, not a
scam. Fake "universities" and unregistered colleges selling worthless
qualifications are a real, common problem in South Africa; this tool is the
lookup people use to protect themselves before they pay tuition.

**Glossary — you'll see these terms everywhere, so learn them now:**

| Term | Meaning |
|---|---|
| **DHET** | Department of Higher Education and Training — the government department that registers institutions. |
| **Annexure A** | The official PDF register DHET publishes, listing every registered/provisional/cancelled institution. The original data source (now scraped by `eduverify-api`, not this repo). |
| **SAQA** | South African Qualifications Authority — the body that registers individual *qualifications* (degrees, diplomas), separately from institutions. |
| **NLRD** | National Learners' Records Database — SAQA's register of all qualifications. |
| **NQF / HEQSF** | National Qualifications Framework / Higher Education Qualifications Sub-Framework. HEQSF is the *subset* of NQF qualifications relevant to higher education — we filter to HEQSF-only, dropping occupational/schooling qualifications. |
| **Registration number** | An institution's official DHET ID, e.g. `2017/HE08/001`. Used as the primary key wherever possible. |
| **Registered / Provisionally Registered / Cancelled / Discontinued / Bogus** | The five statuses an institution can have in the register. "Bogus" is DHET's own official warning list of known scam colleges. |

## What this repo is (and isn't)

```
eduverify/
├── data/    Frozen local seed snapshot (institutions.json, qualifications.json)
└── web/     Next.js — the actual product (search, browse, dashboard)
```

This repo is the product (`web/`) — that's where you'll spend all your time.
The DHET-register/SAQA-qualifications scraping pipeline and the AWS infra
that used to produce and serve institution data (formerly `parser/`,
`terraform/`, `scripts/` in this repo) have been retired here: ingestion now
lives entirely in the sibling **`eduverify-api`** repo, which is the source
of truth for institution/qualification data in DEV, STAGING, and PROD. You
won't need AWS access or Python for day-to-day web work.

`data/institutions.json` and `data/qualifications.json` still live here as a
bundled, frozen seed snapshot — nothing in this repo regenerates them
anymore. They exist purely to power instant client-side typeahead and an
offline fallback (see [Two data sources](#two-data-sources-you-must-understand)
below).

For the full architecture (diagrams, data flow), see the root
[`README.md`](README.md). This guide is the fast-start version; that one is
the reference.

## Day 1: get the web app running

```bash
cd web
npm install
cp .env.local.example .env.local
```

Open `.env.local` and fill in the two Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`CLERK_SECRET_KEY`) — ask a teammate for dev/test values, or create your own
free Clerk instance at https://dashboard.clerk.com if you're just exploring.
Without these, auth-gated pages (`/dashboard`) won't work, but search/browse
will.

By default, `.env.local.example` sets `USE_EXTERNAL_API=true`, which means
`npm run dev` expects a locally-running `eduverify-api` dev server (see that
repo's README: `npm run dynamodb:local`, `npm run seed:local`, then
`PORT=4000 npm run dev` — its default port 3000 collides with this app's own
`next dev`). If you just want to explore without setting that up, set
`USE_EXTERNAL_API=false` instead — you'll get the full product running
against the **bundled local JSON data**, no external service needed. The
local dataset is a real (if frozen) snapshot, so this is enough to develop
the entire search/browse/qualifications experience offline.

```bash
npm run dev
```

Visit `http://localhost:3000`.

Run the tests before you touch anything, so you know what "passing" looks
like on your machine:

```bash
npm run test
npm run build   # catches type errors + Next.js build issues tests won't
```

⚠️ **This repo pins a pre-release Next.js** whose APIs differ from what you
were taught / what an LLM's training data assumes. Before writing any
Next.js-specific code (routing, server components, middleware), read the
matching guide under `web/node_modules/next/dist/docs/` and check
`web/AGENTS.md`. This has bitten people — code that "should" work per
standard Next.js docs can be subtly wrong here.

## Two data sources you must understand

This is the single most important architectural fact in the codebase. Every
institution lookup picks **one** of two sources, controlled by the
`USE_EXTERNAL_API` env var, and they behave differently:

1. **Local bundled JSON** (`web/lib/localData.ts`) — `data/institutions.json`
   (scraped private institutions, frozen) + a hand-maintained
   `web/lib/data/public_universities.json`/`public_tvets.json` (public
   universities/TVETs, which aren't in the DHET private-institution register
   at all). Always available, no network call — powers instant typeahead
   *regardless* of `USE_EXTERNAL_API`, and is also what full search/lookup
   fall back to when the flag is off.
2. **eduverify-api** (`web/lib/apiClient.ts`) — the live, continuously
   re-ingested data. **Server-side only, and only used when
   `USE_EXTERNAL_API=true`.** Unlike the old DynamoDB-direct path this
   replaced, an error here is *not* swallowed — it propagates as a real,
   user-visible outage. If search/lookup breaks in DEV, check whether your
   local `eduverify-api` dev server is actually running before assuming it's
   a bug in this repo.

`web/lib/institutions.ts` is where the choice happens (`searchInstitutions`,
`getInstitution`, `getAllInstitutions`). Start reading here to understand how
a search result actually gets assembled.

## The Golden Rules (non-negotiable)

These are project-wide invariants from [`CLAUDE.md`](CLAUDE.md). Breaking
them silently corrupts data or breaks lookups in ways that are hard to
notice in review:

1. **Test-driven development is mandatory, not optional.** Every bug fix or
   feature — including things that look trivial like a copy change — needs a
   failing test written *first*, then the fix, then a passing suite. This
   isn't a style preference; it's how this team works. See
   [The TDD loop](#the-tdd-loop) below.
2. **`getDisplayName()` must never abbreviate a university name.** It must
   return `"University of Pretoria"`, never `"UP"`. Abbreviations exist only
   for the 2-letter avatar badge (`getInitials()`). This has been broken
   before by accident — see [the pitfall table](#pitfalls-other-people-already-hit) below.
3. **`web/lib/keys.ts` (this repo) and eduverify-api's own `src/lib/keys.ts`
   (a separate repo) implement the *same* institution-keying logic
   independently.** If you change how an institution's key/slug is generated
   in one, you **must** change it in the other, or web lookups by ID will
   silently miss eduverify-api records for affected institutions. There's no
   shared code between the two repos — it's on you to keep them in sync by
   hand.

## The TDD loop

The actual day-to-day loop, concretely:

1. **Reproduce first.** Before writing any fix, write a test that fails
   because of the bug (or captures the missing feature). If you can't make it
   fail, you don't understand the bug yet.
2. **Write the minimum implementation** to make that test pass.
3. **Run the full suite** (`npm run test`, from `web/`), not just your new
   test — regressions elsewhere are the whole point of this rule.
4. **`npm run build`** before you consider a change done — Vitest doesn't
   catch every TypeScript/Next.js build error.
5. Don't add unrelated cleanup, refactors, or "while I'm here" changes in the
   same PR as a bug fix. Small, focused diffs.

## Pitfalls other people already hit

These are real bugs from this codebase's history — reading this table now
will save you from re-discovering them the hard way.

| Symptom | What it actually was | Where to look |
|---|---|---|
| An institution's name showed as an abbreviation ("UJ", "UP") instead of the full name | `publicUniversities.ts` was passing the abbreviation as the `tradingName` argument to `getDisplayName`, which — correctly, by design — prioritizes a real trading name (e.g. `"Damelin"` for `"Educor (Pty) Ltd t/a Damelin"`) over the legal name. The bug was in what the *caller* passed in, not in `getDisplayName` itself. | `web/lib/presentation.ts` (`getDisplayName`), `web/lib/publicUniversities.ts` |
| An institution shown as "Provisionally Registered" when DHET has actually cancelled it | DHET doesn't always move cancelled institutions to the dedicated cancellation section of the source PDF — some (the Educor group: Damelin, City Varsity, ICESA, etc.) stay listed under "Provisionally Registered" with a cancellation notice embedded in the name/contact cell text instead. This is now handled in `eduverify-api`'s ingestion; on this repo's side, the symptom shows up via `web/lib/presentation.ts::getStatusBadge`. | `web/lib/presentation.ts::getStatusBadge` |
| "Search doesn't find [institution]" — but it's not a typo/casing issue | Historically (before ingestion moved to `eduverify-api`), this meant the institution was missing from `data/institutions.json` entirely, upstream of search — always check whether the institution exists in the local seed JSON / eduverify-api response at all before assuming a web-layer search bug. | `data/institutions.json`, `web/lib/localData.ts` |

## Testing cheatsheet

| Suite | Command | Run from |
|---|---|---|
| Web (all) | `npm run test` | `web/` |
| Web (one file) | `npx vitest run path/to/file.test.ts` | `web/` |
| Web (one test) | `npx vitest run -t "test name"` | `web/` |
| Web build check | `npm run build` | `web/` |
| Web lint | `npm run lint` | `web/` |

## Finding your way around `web/lib/`

This is where almost all real logic lives (routes in `web/app/api/*` are
thin wrappers around these). One-line map of what to open depending on what
you're changing:

| If you're working on... | Open this file |
|---|---|
| Whether a lookup goes to local seed data or eduverify-api | `institutions.ts` |
| Search matching/ranking/fuzzy logic | `search.ts` |
| Qualification title fuzzy matching (typos, abbreviations like "bsc") | `qualificationSearch.ts` |
| How a name/badge is displayed | `presentation.ts` (`getDisplayName`, `getStatusBadge`, `getInitials`) |
| Province name cleanup (OCR-noisy source data) | `normalize.ts` |
| Institution ID/slug generation | `keys.ts` — **keep in sync with eduverify-api's `src/lib/keys.ts`** |
| Homepage hero tabs (Recommended/Featured/Recently Added) | `collections.ts` |
| Saved institutions (dashboard) | `savedInstitutions.ts` (signed-out, localStorage) / `dashboardData.ts` (signed-in, Clerk metadata) |
| Faculty/qualification browsing page | `facultiesAndProgrammes.ts`, `qualificationsData.ts` |
| Matching SAQA quals to institutions (the bake step) | `qualificationsMatching.ts` |

## Suggested first tasks

Good ways to build real familiarity:

1. Pick one file from the [`web/lib/`](#finding-your-way-around-weblib) table
   above, read it fully alongside its test file, and explain it back to a
   teammate.
2. Fix a small, well-scoped bug from the issue tracker in `web/` — follow the
   TDD loop above exactly, even if the fix feels obvious.
3. Read a full test file (any `web/**/*.test.ts`) to learn this codebase's
   testing style before writing your first test.

## Where to go next

- [`README.md`](README.md) — full architecture and data-flow diagrams.
- [`CLAUDE.md`](CLAUDE.md) — the project-wide engineering rules (TDD policy,
  data-integrity rules).
- [`web/CLAUDE.md`](web/CLAUDE.md) — the `web/` deep dive.
- Stuck or unsure if something is a known issue vs. a real bug? Ask before
  spending hours on it — several "bugs" in this codebase's history turned
  out to be one-line data quirks once someone with more context looked at
  them (see the [pitfalls table](#pitfalls-other-people-already-hit)).
