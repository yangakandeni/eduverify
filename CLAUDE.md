# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

EduVerify is a lookup tool for South African higher-education institutions (public universities, TVET colleges, and DHET-registered private institutions), so people can verify a qualification/provider is legitimate. The repo has three independent parts that share data through `data/institutions.json`:

- `parser/` — Python pipeline that scrapes the DHET "Annexure A" register PDF into structured institution records.
- `web/` — Next.js app (the product): search/browse UI, dashboard, API routes.
- `terraform/` + `scripts/` — AWS infra (S3 → Lambda → DynamoDB) that runs the parser in production and seeds/queries the live table.

## Commands

### Web app (run from `web/`)

```bash
npm run dev      # dev server
npm run build
npm run lint      # eslint
npm run test      # vitest run
npx vitest run path/to/file.test.ts   # single file
npx vitest run -t "test name"         # single test by name
```

Auth (Clerk) needs `web/.env.local` — copy `web/.env.local.example` and fill in `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` from the Clerk dashboard.

**This repo pins a pre-release Next.js whose APIs diverge from training data.** Before writing any Next.js code in `web/`, read the matching guide under `web/node_modules/next/dist/docs/` and heed its deprecation notices (see `web/AGENTS.md`).

### Parser (run from `parser/`, inside its `.venv`)

```bash
source .venv/bin/activate
pip install -r requirements.txt
pytest                                    # all tests
pytest tests/test_extraction.py           # single file
pytest tests/test_extraction.py -k name   # single test
python fetch_and_parse.py                          # download latest DHET PDF, write ../data/institutions.json
python fetch_and_parse.py --pdf-path FILE          # parse an already-downloaded PDF instead
```

Tests import modules directly (`from build import ...`, no package prefix) — `pytest` must be invoked from `parser/` so its `.venv`'s implicit cwd-on-path resolves them; running from the repo root breaks imports.

### Infra

```bash
cd terraform && terraform plan   # / apply — provisions S3, DynamoDB, Lambda, IAM
python scripts/seed_dynamodb.py                                   # bulk-load data/institutions.json into DynamoDB
python scripts/seed_dynamodb.py --endpoint-url http://localhost:8000  # against DynamoDB Local
```

## Architecture

### Parser pipeline (`parser/`)

One-way, composable stages, each independently unit-tested and side-effect-free where possible:

1. `pdf_extract.iter_status_rows` — walks the PDF via `pdfplumber`, tagging every table row with the registration-status section it's under (Registered / Provisionally Registered), and dropping rows from incompatible sections (lapsed/cancelled/bogus-colleges lists) before they can get merged into a real record.
2. `grouping.group_table_rows` — the DHET table wraps one institution across multiple physical rows (and page breaks); a new record starts only when the leading index column ("1.", "2.", ...) is populated, everything else is a continuation appended to the current record.
3. `extraction.py` — pure regex helpers that pull structured fields (name, phones, emails, website, registration number, address, qualification list) out of a grouped record's raw multi-line cell text.
4. `build.record_to_institution` — assembles a validated `models.Institution` (pydantic) from a grouped record, returning `None` for unparseable rows rather than raising.
5. Two entry points consume the same pipeline: `fetch_and_parse.py` (CLI, writes `data/institutions.json` for local dev / the web app's bundled seed data) and `lambda_handler.py` (S3-triggered production ingestion, writes to DynamoDB via `dynamo_item.to_item` and drops a JSON backup to S3).

`dynamo_item.to_item`/`institution_key` is the single source of truth for how an institution is keyed (`INST#<registration_number>`, or `INST#NAME#<slug>` when no registration number exists) — both `lambda_handler.py` and `scripts/seed_dynamodb.py` import it so live ingestion and bulk seeding key records identically. **`web/lib/keys.ts` reimplements the same slugify/key logic in TypeScript** — if one changes, the other must too, or web lookups by ID will miss DynamoDB rows.

### Web app (`web/`)

Data layer (`web/lib/`) has two institution sources merged at the API boundary:

- **Local seed data** (`web/lib/localData.ts`): bundles `data/institutions.json` (private institutions, scraped) plus `web/lib/data/public_universities.json` (hand-maintained public universities/TVETs, via `publicUniversities.ts`) into one deduped, always-available in-memory list (`ALL_INSTITUTIONS`). Powers instant typeahead and the browse/discovery homepage — no network call.
- **DynamoDB** (`web/lib/dynamodb.ts`): the live register, single-table design with `PK` = institution key, `GSI1PK` = uppercased status, `GSI1SK` = name (enables prefix search per status partition). Only reachable server-side.
- **`web/lib/institutions.ts`** is where they combine: `searchInstitutions` queries DynamoDB (exact registration-number + name-prefix) and always also runs local fuzzy search (`search.ts`) in parallel — local search is both the offline fallback and the only way to catch partial/lowercase queries, since DynamoDB's `GSI1SK` matching is exact-prefix and case-sensitive. Results are deduped by id and merged. Any DynamoDB error is caught and logged, falling back to local-only silently (never surfaced as a user-facing error).

Route split in `app/api/`:
- `GET /api/search?q=&mode=typeahead` — local-only, instant, for the search-as-you-type UI.
- `GET /api/search?q=` (no mode) — full search, hits DynamoDB + local.
- `GET /api/institutions` — local seed list only, powers the homepage grid/hero.
- `GET /api/institutions/[id]` — DynamoDB first, local fallback.

Qualification strings are parsed twice from the same raw format (once in Python at scrape time is *not* done — the raw string is kept as-is in `data/institutions.json`; structuring into `{title, nqfLevel, credits, mode, saqaId, campuses}` happens client/server-side in TS): `web/lib/qualifications.ts` (seed data path) and inline in `dynamodb.ts`'s `toRecord` (DynamoDB path) both call the same `parseQualification`.

Province names are inconsistent/OCR-noisy in the source register; `web/lib/normalize.ts` maps free text to one of `CANONICAL_PROVINCES` (or `"Unknown"`), and is the single place province-matching logic lives (used by search, filters, and the location-based hero).

`web/lib/location.ts` does best-effort client-side IP geolocation (via a public, unauthenticated API, 2.5s timeout) to pick a default province for the homepage hero; any failure — network, timeout, non-SA region — resolves to `null` and callers fall back to `DEFAULT_PROVINCE` ("Gauteng", the province with the most institutions). A manual province pick by the user always wins over a late-arriving geolocation result.

`web/lib/collections.ts` builds the homepage hero's tabs (Recommended/Featured/Recently Added) from `ALL_INSTITUTIONS` plus a province, ranking institutions by sponsorship/type tier then qualification count; Featured/Recently Added tabs are omitted entirely when empty rather than rendered blank.

Auth is Clerk, wired via `web/proxy.ts` (Next middleware): only `/dashboard(.*)` is protected. `web/lib/dashboardData.ts` (saved/recently-viewed institutions) is currently stubbed to return empty arrays — no per-user DynamoDB table exists yet.

### Infra (`terraform/`)

`main.tf` wires four modules: `s3` (raw PDF uploads under `raw/`), `dynamodb` (the institutions table + GSI1), `iam` (Lambda execution role), `lambda` (packages `parser/` using `requirements-lambda.txt`, a trimmed dependency set for cold-start size). An S3 `ObjectCreated` notification on `raw/*.pdf` invokes the Lambda, which is `parser/lambda_handler.py`.

# EduVerify SA - Claude Code Engineering Guidelines

## Core Development Philosophy: Test-Driven Development (TDD)
1. **Red-Green-Refactor Mandatory**: ALWAYS write or update automated unit/integration tests covering reported bugs or new requirements BEFORE touching implementation code.
2. **Zero Regressions Rule**: No feature implementation or refactoring task is considered complete until 100% of existing and new test suites pass.
3. **Data Integrity & Name Sanitation**:
   - `getDisplayName(institution)` MUST return the full, human-readable institution title (e.g., "University of Pretoria", "Stellenbosch University").
   - `getDisplayName` MUST NEVER reduce a public university's full name to an abbreviation (e.g., NEVER return "UP", "TUT", "Wits", "UJ"). Abbreviations are reserved strictly for 2-letter visual avatar badges (`getInitials()`).
   - `getDisplayName` MUST cleanly strip legal bloat including `(Pty) Ltd`, `(The)`, `NPC`, `Limited`, `(Incorporated in...)`, and trailing parenthetical notes.

## Required Test Execution Commands
- Parser Tests: `pytest`
- Web Frontend Tests: `npm run test` or `npm run test:ci`
- Verification Build: `npm run build`
