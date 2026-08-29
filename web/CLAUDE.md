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

Data layer (`web/lib/`) has two institution sources, selected by `USE_EXTERNAL_API`:

- **Local seed data** (`web/lib/localData.ts`): bundles `data/institutions.json` (private institutions, scraped — a frozen snapshot, no longer refreshed by anything in this repo) plus `web/lib/data/public_universities.json` (hand-maintained public universities/TVETs, via `publicUniversities.ts`) into one deduped, always-available in-memory list (`ALL_INSTITUTIONS`). Powers instant typeahead and the browse/discovery homepage — no network call — regardless of `USE_EXTERNAL_API`, and is also the offline/`USE_EXTERNAL_API=false` fallback for full search and single-institution lookup.
- **eduverify-api** (`web/lib/apiClient.ts`): the source of truth for institution/qualification data in DEV, STAGING, and PROD. Only reachable server-side.
- **`web/lib/institutions.ts`** is where the choice is made: with `USE_EXTERNAL_API=true`, `searchInstitutions`/`getInstitution`/`getAllInstitutions` call eduverify-api and let any error propagate (an API outage is a real, user-facing outage — no local fallback on that path); with it unset/`false`, they read `ALL_INSTITUTIONS`/`search.ts`'s local fuzzy search instead.

Route split in `app/api/`:
- `GET /api/search?q=&mode=typeahead` — local-only, instant, for the search-as-you-type UI, regardless of `USE_EXTERNAL_API`.
- `GET /api/search?q=` (no mode) — full search, via `institutions.ts` (eduverify-api or local, per `USE_EXTERNAL_API`).
- `GET /api/institutions` — local seed list only, powers the homepage grid/hero when `USE_EXTERNAL_API=false`.
- `GET /api/institutions/[id]` — via `institutions.ts` (eduverify-api or local).

An institution's qualifications are pre-matched against SAQA's NLRD register (`data/qualifications.json`) and baked directly into `data/institutions.json` / `web/lib/data/public_universities.json` / `public_tvets.json` as `faculties_and_programmes: {faculty, programmes}[]` by `web/scripts/bakeFacultiesAndProgrammes.ts` (`npm run bake:faculties`, reusing `web/lib/qualificationsMatching.ts`'s name-matching). Because the match is pre-baked, `web/lib/localData.ts` just passes the field straight through, and `institutions.ts`'s `normalizeApiInstitution` defaults it to `[]` for an eduverify-api response that omits it; `web/lib/facultiesAndProgrammes.ts`'s `getAllProgrammes(institution)` is the one place to read "every qualification for this institution" from.

Province names are inconsistent/OCR-noisy in the source register; `web/lib/normalize.ts` maps free text to one of `CANONICAL_PROVINCES` (or `"Unknown"`), and is the single place province-matching logic lives (used by search, filters, and the location-based hero).

`web/lib/location.ts` does best-effort client-side IP geolocation (via a public, unauthenticated API, 2.5s timeout) to pick a default province for the homepage hero; any failure — network, timeout, non-SA region — resolves to `null` and callers fall back to `DEFAULT_PROVINCE` ("Gauteng", the province with the most institutions). A manual province pick by the user always wins over a late-arriving geolocation result.

`web/lib/collections.ts` builds the homepage hero's tabs (Recommended/Featured/Recently Added) from `ALL_INSTITUTIONS` plus a province, ranking institutions by sponsorship/type tier then qualification count; Featured/Recently Added tabs are omitted entirely when empty rather than rendered blank.

Auth is Clerk, wired via `web/proxy.ts` (Next middleware): only `/dashboard(.*)` is protected. `web/lib/dashboardData.ts` (saved/recently-viewed institutions) is currently stubbed to return empty arrays — no per-user DynamoDB table exists yet.

## Environments (DEV / STAGING / PROD)

DEV is a local `npm run dev` with `USE_EXTERNAL_API=true` by default (see `.env.local.example`) — it calls a locally-running `eduverify-api` dev server instead of the bundled local-seed data, so this repo doesn't need to hold its own copy of institution/qualification state day-to-day. Start `eduverify-api` first (`npm run dynamodb:local`, `npm run seed:local`, then `PORT=4000 npm run dev` in that repo — its default port 3000 collides with this app's own `next dev`). Set `USE_EXTERNAL_API=false` locally to fall back to the bundled seed data (e.g. for offline work, or when `eduverify-api` isn't running — there's no automatic fallback if the flag is `true` and the API is unreachable). STAGING (the `staging` branch) and PROD (`main`) both set `USE_EXTERNAL_API=true` in the Amplify Console — STAGING against `eduverify-api-staging`, PROD against `eduverify-api-prod`. Both branches are branch-protected (required PR + passing CI); direct pushes to `main`/`staging` are rejected.
