# parser/CLAUDE.md

Guidance for working in `parser/`. See the repo root `CLAUDE.md` for what this part fits into.

## Commands (run from `parser/`, inside its `.venv`)

```bash
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest                                    # all tests
python -m pytest tests/test_extraction.py           # single file
python -m pytest tests/test_extraction.py -k name   # single test
python fetch_and_parse.py                          # download latest DHET PDF, write ../data/institutions.json
python fetch_and_parse.py --pdf-path FILE          # parse an already-downloaded PDF instead
python fetch_and_parse_qualifications.py           # download latest SAQA NLRD register, write ../data/qualifications.json
```

Tests import modules directly (`from build import ...`, no package prefix) — invoke with `python -m pytest` (not the bare `pytest` script) from `parser/` so cwd is on `sys.path`; running from the repo root, or via the bare `pytest` command, breaks imports.

**After re-running `fetch_and_parse.py`, `../data/institutions.json`'s `qualifications` field is raw,
unmatched scraped strings again — SAQA-matched `faculties_and_programmes` must be re-baked in before the
file is used or seeded.** From `web/`, run `npm run bake:faculties` (a Node/TS script,
`web/scripts/bakeFacultiesAndProgrammes.ts`, that reuses `web/lib/qualificationsMatching.ts`'s existing
name-matching logic rather than reimplementing it in Python). This enriches `../data/institutions.json`
*and* `web/lib/data/public_universities.json`/`public_tvets.json` in place, replacing their ad-hoc
`qualifications`/`degrees` fields with `faculties_and_programmes: {faculty, programmes}[]` matched against
`../data/qualifications.json`. Run this before `python scripts/seed_dynamodb.py`, or the seeded DynamoDB
table will carry stale/absent `faculties_and_programmes`. Note: the live S3→Lambda ingestion path
(`lambda_handler.py`) does **not** run this bake step — institutions ingested that way will lack
`faculties_and_programmes` until the next manual reseed.

## Architecture

One-way, composable stages, each independently unit-tested and side-effect-free where possible:

1. `pdf_extract.iter_status_rows` — walks the PDF via `pdfplumber`, tagging every table row with the registration-status section it's under. The Annexure A register has 6 numbered sections, all of which are now surfaced (none are silently dropped):
   1. **REGISTERED INSTITUTIONS** — tabular (NAME/ADDRESS/REG-NO/PROVINCE/QUALIFICATIONS), parsed as status `"Registered"`.
   2. **PROVISIONALLY REGISTERED INSTITUTIONS** — same tabular layout, parsed as status `"Provisionally Registered"`.
   3. **THE REGISTRATION OF THE FOLLOWING INSTITUTIONS ARE CANCELLED...** — same 6-column tabular layout as sections 1-2, tagged status `"Cancelled"` by `_CANCELLED_RE` and grouped through the same `grouping.group_table_rows` pipeline. (DHET also lists some cancelled institutions inside section 2 with a cancellation-notice phrase instead of using this section — see the cancelled-institutions memory — which is why `build.record_to_institution`'s `has_cancellation_notice` override still matters independently of this section.)
   4. **INSTITUTIONS FOR WHICH CANCELLATION OR LAPSE OF REGISTRATION HAS COME INTO EFFECT** — a numbered list of institution *names only* ("1) Some College"), not a table row `iter_status_rows` can yield. Read from each page's plain text by `pdf_extract.iter_name_list_entries` / `parse_name_list_lines`, tagged status `"Cancelled"`.
   5. **INSTITUTIONS WHICH HAVE REQUESTED THAT THE REGISTRAR DISCONTINUE THEIR REGISTRATION** — same numbered-list-of-names format as section 4, also read by `iter_name_list_entries`, tagged status `"Discontinued"`.
   6. **WARNING: ILLEGAL COLLEGES ALSO KNOWN AS BOGUS COLLEGES** — *is* a real pdfplumber table, but incompatible with the 6-column schema: the "N." index is embedded in the NAME cell itself (not a separate column) and the column count varies page to page. Tagged status `"Bogus"` by `_BOGUS_RE` and grouped separately by `grouping.group_bogus_rows`, which tracks only the NAME column (address/programme detail isn't needed for a warning list and isn't laid out consistently enough to parse).
2. `grouping.group_table_rows` — the DHET table wraps one institution across multiple physical rows (and page breaks); a new record starts only when the leading index column ("1.", "2.", ...) is populated, everything else is a continuation appended to the current record. Handles sections 1-3.
3. `extraction.py` — pure regex helpers that pull structured fields (name, phones, emails, website, registration number, address, qualification list) out of a grouped record's raw multi-line cell text.
4. `build.record_to_institution` — assembles a validated `models.Institution` (pydantic) from a grouped record, returning `None` for unparseable rows rather than raising. A section 4-6 record has only `name_block` populated (no address/reg-no/qualifications), which is fine since `Institution` only requires a name.
5. `build.build_institutions(pdf_path)` — the single entry point that assembles all 6 sections: filters `iter_status_rows` by status to route sections 1-3 through `group_table_rows` and section 6 through `group_bogus_rows`, appends sections 4-5 from `iter_name_list_entries`, then runs every record through `record_to_institution`. Both `fetch_and_parse.py` (CLI, writes `data/institutions.json`) and `lambda_handler.py` (S3-triggered production ingestion, writes to DynamoDB via `dynamo_item.to_item` and drops a JSON backup to S3) call this one function rather than duplicating the assembly logic.

`dynamo_item.to_item`/`institution_key` is the single source of truth for how an institution is keyed (`INST#<registration_number>`, or `INST#NAME#<slug>` when no registration number exists) — both `lambda_handler.py` and `scripts/seed_dynamodb.py` import it so live ingestion and bulk seeding key records identically. **`web/lib/keys.ts` reimplements the same slugify/key logic in TypeScript** — if one changes, the other must too, or web lookups by ID will miss DynamoDB rows.
