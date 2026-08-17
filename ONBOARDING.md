# Welcome to EduVerify

This guide is for a new engineer with no prior context on this repo. It gets
you from "never seen this codebase" to "can safely ship a change" — with the
domain jargon explained, the landmines flagged, and pointers to the deeper
docs once you need them.

Read this once, top to bottom, before writing code. It's long because the
codebase has real domain complexity (government PDFs, two data sources, two
storage layers) — but every section is here to save you a debugging session
someone else already had.

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
| **Annexure A** | The official PDF register DHET publishes, listing every registered/provisional/cancelled institution. This is our primary data source. |
| **SAQA** | South African Qualifications Authority — the body that registers individual *qualifications* (degrees, diplomas), separately from institutions. |
| **NLRD** | National Learners' Records Database — SAQA's register of all qualifications. We use their "All Qualifications and Part-Qualifications" export. |
| **NQF / HEQSF** | National Qualifications Framework / Higher Education Qualifications Sub-Framework. HEQSF is the *subset* of NQF qualifications relevant to higher education — we filter to HEQSF-only, dropping occupational/schooling qualifications. |
| **Registration number** | An institution's official DHET ID, e.g. `2017/HE08/001`. Used as the primary key wherever possible. |
| **Registered / Provisionally Registered / Cancelled / Discontinued / Bogus** | The five statuses an institution can have in the register. "Bogus" is DHET's own official warning list of known scam colleges. |

## The three parts of this repo

```
eduverify/
├── parser/      Python — scrapes the DHET PDF + SAQA spreadsheet into JSON
├── web/         Next.js — the actual product (search, browse, dashboard)
└── terraform/   AWS infra — runs the parser in production, powered by scripts/
```

They share data through two files: `data/institutions.json` and
`data/qualifications.json`. As a new engineer, **you will spend almost all
your time in `web/`.** You may occasionally touch `parser/` when a specific
institution is missing or mis-parsed. You should not touch `terraform/`
without a senior engineer pairing with you — it manages real AWS accounts.

For the full architecture (diagrams, data flow, AWS layout), see the root
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

```bash
npm run dev
```

Visit `http://localhost:3000`. You now have the full product running against
the **bundled local JSON data** — no AWS access needed. This is deliberate:
the local dataset is a complete, real snapshot, so you can develop the entire
search/browse/qualifications experience offline. DynamoDB (the live,
production-updated data) is only reachable server-side and only adds
*incremental freshness* on top — see [Two data sources](#two-data-sources-you-must-understand)
below.

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
institution lookup merges **two** sources, and they behave differently:

1. **Local bundled JSON** (`web/lib/localData.ts`) — `data/institutions.json`
   (scraped private institutions) + a hand-maintained
   `web/lib/data/public_universities.json`/`public_tvets.json` (public
   universities/TVETs, which aren't in the DHET private-institution register
   at all). Always available, no network call, powers instant typeahead.
2. **DynamoDB** (`web/lib/dynamodb.ts`) — the live table, updated by the
   production ingestion pipeline. **Server-side only.** If it errors or
   times out, the failure is caught and logged **silently** — the user just
   sees local-only results, never an error message. Keep this in mind when
   debugging "why didn't my DynamoDB change show up" — check the server logs,
   because the UI won't tell you it failed.

`web/lib/institutions.ts` is where the merge happens (`searchInstitutions`,
`getInstitution`) — dedupes both sources by id. Start reading here to
understand how a search result actually gets assembled.

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
3. **`web/lib/keys.ts` (TypeScript) and `parser/dynamo_item.py` (Python)
   implement the *same* institution-keying logic independently.** If you
   change how an institution's key/slug is generated in one, you **must**
   change it in the other, or web lookups by ID will silently miss DynamoDB
   rows for affected institutions. There's no shared code between them —
   it's on you to keep them in sync by hand.
4. **After re-running the parser, qualifications data goes stale until
   re-baked.** `data/institutions.json`'s `qualifications` field resets to
   raw/unmatched text every time `parser/fetch_and_parse.py` runs. You must
   run `npm run bake:faculties` (from `web/`) afterward to re-match against
   SAQA data before the file is usable. See
   [Working with the parser](#working-with-the-parser-when-you-need-to) below.

## The TDD loop

The actual day-to-day loop, concretely:

1. **Reproduce first.** Before writing any fix, write a test that fails
   because of the bug (or captures the missing feature). If you can't make it
   fail, you don't understand the bug yet.
2. **Write the minimum implementation** to make that test pass.
3. **Run the full suite**, not just your new test — regressions elsewhere are
   the whole point of this rule.
   - Web: `npm run test` (from `web/`)
   - Parser: `python -m pytest` (from `parser/`, inside its `.venv` —
     **must** use `python -m pytest`, not the bare `pytest` command, or
     imports break — see `parser/CLAUDE.md`)
4. **`npm run build`** before you consider a web change done — Vitest doesn't
   catch every TypeScript/Next.js build error.
5. Don't add unrelated cleanup, refactors, or "while I'm here" changes in the
   same PR as a bug fix. Small, focused diffs.

## Pitfalls other people already hit

These are real bugs from this codebase's history — reading this table now
will save you from re-discovering them the hard way.

| Symptom | What it actually was | Where to look |
|---|---|---|
| An institution's name showed as an abbreviation ("UJ", "UP") instead of the full name | `publicUniversities.ts` was passing the abbreviation as the `tradingName` argument to `getDisplayName`, which — correctly, by design — prioritizes a real trading name (e.g. `"Damelin"` for `"Educor (Pty) Ltd t/a Damelin"`) over the legal name. The bug was in what the *caller* passed in, not in `getDisplayName` itself. | `web/lib/presentation.ts` (`getDisplayName`), `web/lib/publicUniversities.ts` |
| "Search doesn't find [institution]" — but it's not a typo/casing issue | The institution was missing from `data/institutions.json` **entirely**, upstream of search. A regex meant to detect phone-number lines in `extraction.py` was also matching the first line of any institution name that starts with a digit (e.g. "2 Oceans Graduate Institute"), causing the whole record to be silently dropped with no error. | `parser/extraction.py` (`extract_name`) — **always check whether the institution exists in the JSON at all before touching web-layer search code.** |
| An institution shown as "Provisionally Registered" when DHET has actually cancelled it | DHET doesn't always move cancelled institutions to the dedicated cancellation section of the PDF — some (the Educor group: Damelin, City Varsity, ICESA, etc.) stay listed under "Provisionally Registered" with a cancellation notice embedded in the name/contact cell text instead. | `parser/extraction.py::has_cancellation_notice`, `parser/build.py::record_to_institution` (status override), `web/lib/presentation.ts::getStatusBadge` |
| Weekly EventBridge-triggered Lambda run shows nothing happened, no error | **This is expected, not a bug (today).** `lambda_handler.handler` only handles the S3-upload event shape (`event["Records"]`); the EventBridge payload has no `Records` key, so it returns `{"processed": []}` every time. The schedule doesn't actually fetch/ingest anything yet — it's a known gap, not something broken that you introduced. | `parser/lambda_handler.py`, `terraform/eventbridge.tf` |

## Working with the parser (when you need to)

You'll usually only touch `parser/` when an institution is missing, mislabeled,
or a new DHET register PDF needs to be ingested locally.

```bash
cd parser
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest                              # run tests
python fetch_and_parse.py --pdf-path FILE     # parse an already-downloaded PDF
python fetch_and_parse_qualifications.py      # SAQA NLRD register → data/qualifications.json
```

Two environment gotchas that have hit people on this project before (not
universal — may or may not affect your machine, but check first if setup
fails weirdly):

- If `pip install` fails on `pydantic-core` with a Rust/cargo build error,
  your `.venv` was probably created with too new a Python version. Recreate
  it pinned to Python 3.12.
- If the built-in PDF downloader throws an SSL certificate error, it's
  likely a corporate TLS proxy intercepting the connection. Work around it
  with `curl -o annexure_a.pdf "<url>"` then
  `python fetch_and_parse.py --pdf-path annexure_a.pdf` instead of letting
  the script download directly.

After any parser re-run, remember **Golden Rule 4**: run `npm run bake:faculties`
from `web/` before the regenerated `data/institutions.json` is usable, and
before seeding DynamoDB.

Full pipeline architecture (why there are 6 register sections, how table rows
get grouped across page breaks, etc.) is documented in `parser/CLAUDE.md` —
read it before making non-trivial parser changes.

## Testing cheatsheet

| Suite | Command | Run from |
|---|---|---|
| Web (all) | `npm run test` | `web/` |
| Web (one file) | `npx vitest run path/to/file.test.ts` | `web/` |
| Web (one test) | `npx vitest run -t "test name"` | `web/` |
| Web build check | `npm run build` | `web/` |
| Web lint | `npm run lint` | `web/` |
| Parser (all) | `python -m pytest` | `parser/` (inside `.venv`) |
| Parser (one file) | `python -m pytest tests/test_extraction.py` | `parser/` |

## Finding your way around `web/lib/`

This is where almost all real logic lives (routes in `web/app/api/*` are
thin wrappers around these). One-line map of what to open depending on what
you're changing:

| If you're working on... | Open this file |
|---|---|
| How institutions merge across local + DynamoDB | `institutions.ts` |
| Search matching/ranking/fuzzy logic | `search.ts` |
| Qualification title fuzzy matching (typos, abbreviations like "bsc") | `qualificationSearch.ts` |
| How a name/badge is displayed | `presentation.ts` (`getDisplayName`, `getStatusBadge`, `getInitials`) |
| Province name cleanup (OCR-noisy source data) | `normalize.ts` |
| Institution ID/slug generation | `keys.ts` — **keep in sync with `parser/dynamo_item.py`** |
| Homepage hero tabs (Recommended/Featured/Recently Added) | `collections.ts` |
| Saved institutions (dashboard) | `savedInstitutions.ts` (signed-out, localStorage) / `dashboardData.ts` (signed-in, Clerk metadata) |
| Faculty/qualification browsing page | `facultiesAndProgrammes.ts`, `qualificationsData.ts` |
| Matching SAQA quals to institutions (the bake step) | `qualificationsMatching.ts` |

## Infra and deployment (read-only for now)

`terraform/` provisions real AWS infrastructure across **two fully separate
AWS accounts** (staging and production) — this is not a sandbox. As a new
engineer:

- Don't run `terraform apply` yourself yet.
- Do read `docs/DEPLOYMENT.md` and `terraform/CLAUDE.md` to understand the
  shape of it (S3 → Lambda → DynamoDB, Amplify hosting) before you're asked
  to touch it.
- `scripts/seed_dynamodb.py` bulk-loads `data/institutions.json` into
  DynamoDB — useful against a local DynamoDB Local instance
  (`--endpoint-url http://localhost:8000`) if you want to test the DynamoDB
  code path without touching real infra.

## Suggested first tasks

Good ways to build real familiarity without needing infra access:

1. Pick one file from the [`web/lib/`](#finding-your-way-around-weblib) table
   above, read it fully alongside its test file, and explain it back to a
   teammate.
2. Fix a small, well-scoped bug from the issue tracker in `web/` — follow the
   TDD loop above exactly, even if the fix feels obvious.
3. Run the parser locally against the sample fixture
   (`parser/fixtures/annexure_a_sample.pdf`) and diff the output against
   `data/institutions.json` to build intuition for what the pipeline
   actually produces.
4. Read one full test file per part (`parser/tests/test_extraction.py`,
   any `web/**/*.test.ts`) to learn this codebase's testing style before
   writing your first test.

## Where to go next

- [`README.md`](README.md) — full architecture, diagrams, AWS infra detail.
- [`CLAUDE.md`](CLAUDE.md) — the project-wide engineering rules (TDD policy,
  data-integrity rules).
- [`parser/CLAUDE.md`](parser/CLAUDE.md), [`web/CLAUDE.md`](web/CLAUDE.md),
  [`terraform/CLAUDE.md`](terraform/CLAUDE.md) — per-part deep dives.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — the deployment runbook.
- Stuck or unsure if something is a known issue vs. a real bug? Ask before
  spending hours on it — several "bugs" in this codebase's history turned
  out to be one-line data quirks once someone with more context looked at
  them (see the [pitfalls table](#pitfalls-other-people-already-hit)).
