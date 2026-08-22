@AGENTS.md

## Designing UI

Always use the `ui-ux-pro-max` skill for any frontend feature, change, or bug fix in `web/` — not just visual design work. This includes colors, typography, spacing, layout, component styling, and accessibility, but also structural/behavioral changes to components and pages. Invoke it before touching frontend code, and treat it as the source of truth over ad-hoc styling or layout choices.

## Commands (run from `web/`)

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

## Architecture

Data layer (`web/lib/`) has two institution sources merged at the API boundary:

- **Local seed data** (`web/lib/localData.ts`): bundles `data/institutions.json` (private institutions, scraped) plus `web/lib/data/public_universities.json` (hand-maintained public universities/TVETs, via `publicUniversities.ts`) into one deduped, always-available in-memory list (`ALL_INSTITUTIONS`). Powers instant typeahead and the browse/discovery homepage — no network call.
- **DynamoDB** (`web/lib/dynamodb.ts`): the live register, single-table design with `PK` = institution key, `GSI1PK` = uppercased status, `GSI1SK` = name (enables prefix search per status partition). Only reachable server-side.
- **`web/lib/institutions.ts`** is where they combine: `searchInstitutions` queries DynamoDB (exact registration-number + name-prefix) and always also runs local fuzzy search (`search.ts`) in parallel — local search is both the offline fallback and the only way to catch partial/lowercase queries, since DynamoDB's `GSI1SK` matching is exact-prefix and case-sensitive. Results are deduped by id and merged. Any DynamoDB error is caught and logged, falling back to local-only silently (never surfaced as a user-facing error).

Route split in `app/api/`:
- `GET /api/search?q=&mode=typeahead` — local-only, instant, for the search-as-you-type UI.
- `GET /api/search?q=` (no mode) — full search, hits DynamoDB + local.
- `GET /api/institutions` — local seed list only, powers the homepage grid/hero.
- `GET /api/institutions/[id]` — DynamoDB first, local fallback.

An institution's qualifications are pre-matched against SAQA's NLRD register (`data/qualifications.json`) and baked directly into `data/institutions.json` / `web/lib/data/public_universities.json` / `public_tvets.json` as `faculties_and_programmes: {faculty, programmes}[]` by `web/scripts/bakeFacultiesAndProgrammes.ts` (`npm run bake:faculties`, reusing `web/lib/qualificationsMatching.ts`'s name-matching) — this must be re-run after any `parser/fetch_and_parse.py` re-scrape, since that resets the field back to raw/unmatched (see `parser/CLAUDE.md`). Because the match is pre-baked, `web/lib/localData.ts` and `dynamodb.ts`'s `toRecord` both just pass the field straight through; `web/lib/facultiesAndProgrammes.ts`'s `getAllProgrammes(institution)` is the one place to read "every qualification for this institution" from.

Province names are inconsistent/OCR-noisy in the source register; `web/lib/normalize.ts` maps free text to one of `CANONICAL_PROVINCES` (or `"Unknown"`), and is the single place province-matching logic lives (used by search, filters, and the location-based hero).

`web/lib/location.ts` does best-effort client-side IP geolocation (via a public, unauthenticated API, 2.5s timeout) to pick a default province for the homepage hero; any failure — network, timeout, non-SA region — resolves to `null` and callers fall back to `DEFAULT_PROVINCE` ("Gauteng", the province with the most institutions). A manual province pick by the user always wins over a late-arriving geolocation result.

`web/lib/collections.ts` builds the homepage hero's tabs (Recommended/Featured/Recently Added) from `ALL_INSTITUTIONS` plus a province, ranking institutions by sponsorship/type tier then qualification count; Featured/Recently Added tabs are omitted entirely when empty rather than rendered blank.

Auth is Clerk, wired via `web/proxy.ts` (Next middleware): only `/dashboard(.*)` is protected. `web/lib/dashboardData.ts` (saved/recently-viewed institutions) is currently stubbed to return empty arrays — no per-user DynamoDB table exists yet.

## Environments (DEV / STAGING / PROD)

DEV is a local `npm run dev` with `USE_EXTERNAL_API` unset — always the local-seed/DynamoDB-optional path in `institutions.ts` above, never `eduverify-api`. STAGING (the `staging` branch) sets `USE_EXTERNAL_API=true`. PROD (`main`) stays `false` until the parity check against `eduverify-api` is done. See `docs/DEPLOYMENT.md`'s "DEV, and the branch → environment flow" for the full feature-branch → staging → main promotion path and why direct pushes to `main`/`staging` are rejected.
