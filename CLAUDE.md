# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Learning about this codebase

Always use the `graphify` skill first when answering questions about this codebase's architecture, file relationships, or project content — treat it as the primary tool for codebase exploration, not a fallback. If `graphify-out/` exists, query it before searching the repo manually.

## Coding style

Every new feature, change, or bug fix must be built test-driven (TDD): write or update the automated test that covers the behavior before touching implementation code, and don't call the work done until it passes. See "Core Development Philosophy: Test-Driven Development (TDD)" below for the full policy.

## What this is

EduVerify is a lookup tool for South African higher-education institutions (public universities, TVET colleges, and DHET-registered private institutions), so people can verify a qualification/provider is legitimate. The repo has three independent parts that share data through `data/institutions.json`:

- `parser/` — Python pipeline that scrapes the DHET "Annexure A" register PDF into structured institution records. See `parser/CLAUDE.md`.
- `web/` — Next.js app (the product): search/browse UI, dashboard, API routes. See `web/CLAUDE.md`.
- `terraform/` + `scripts/` — AWS infra (S3 → Lambda → DynamoDB) that runs the parser in production and seeds/queries the live table. See `terraform/CLAUDE.md`.

**Account-topology note**: `terraform/data-stack/` (which used to provision a second, independently-ingested copy of this infra in the `eduverify-api-staging`/`eduverify-api-prod` AWS accounts) has been retired — that ingestion stack now lives in the sibling `eduverify-api` repo's own `terraform/ingestion/`, which adopted the same live Terraform state. This doesn't change the three-part framing above: `parser/` and `terraform/`+`scripts/` here still back the table production actually reads from (`USE_EXTERNAL_API=false`) until a separate future cutover.

# EduVerify - Claude Code Engineering Guidelines

## Core Development Philosophy: Test-Driven Development (TDD)
1. **Red-Green-Refactor Mandatory**: ALWAYS write or update automated unit/integration tests covering reported bugs or new requirements BEFORE touching implementation code.
2. **Zero Regressions Rule**: No feature implementation or refactoring task is considered complete until 100% of existing and new test suites pass.
3. **Tests Are Mandatory, Not Optional**: Every new feature, behavior change, or bug fix — including ones that look trivial (copy/label changes, prop renames, styling tweaks) — MUST land with an automated test covering it. A change is not "done" without a passing test asserting the new behavior; do not defer this to "if there's time."
4. **Data Integrity & Name Sanitation**:
   - `getDisplayName(institution)` MUST return the full, human-readable institution title (e.g., "University of Pretoria", "Stellenbosch University").
   - `getDisplayName` MUST NEVER reduce a public university's full name to an abbreviation (e.g., NEVER return "UP", "TUT", "Wits", "UJ"). Abbreviations are reserved strictly for 2-letter visual avatar badges (`getInitials()`).
   - `getDisplayName` MUST cleanly strip legal bloat including `(Pty) Ltd`, `(The)`, `NPC`, `Limited`, `(Incorporated in...)`, and trailing parenthetical notes.

## Required Test Execution Commands
- Parser Tests: `pytest`
- Web Frontend Tests: `npm run test` or `npm run test:ci`
- Verification Build: `npm run build`
