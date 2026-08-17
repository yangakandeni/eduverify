/**
 * Throwaway parity-check script for Part 3, step 4 of the eduverify-api cutover plan.
 * Diffs the legacy local-data path against the USE_EXTERNAL_API=true path for a sample of
 * institutions and search queries, and checks the one invariant that must never drift:
 * getDisplayName never abbreviates a public university.
 *
 * Run from web/: npx tsx scripts/parityCheck.ts
 * Needs EDUVERIFY_API_BASE_URL / EDUVERIFY_API_KEY in .env.local (staging values).
 */
import type { InstitutionRecord } from "../lib/types";

const COMPARED_FIELDS: (keyof InstitutionRecord)[] = [
  "name",
  "registration_number",
  "status",
  "province",
  "institutionType",
];

const SAMPLE_QUERIES = ["university", "cape town", "college", "engineering", "IT"];

async function withExternalApi<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.USE_EXTERNAL_API;
  process.env.USE_EXTERNAL_API = "true";
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.USE_EXTERNAL_API;
    else process.env.USE_EXTERNAL_API = previous;
  }
}

function diffRecord(local: InstitutionRecord, api: InstitutionRecord): string[] {
  const issues: string[] = [];
  for (const field of COMPARED_FIELDS) {
    if (JSON.stringify(local[field]) !== JSON.stringify(api[field])) {
      issues.push(`${field}: local=${JSON.stringify(local[field])} api=${JSON.stringify(api[field])}`);
    }
  }
  const localFacultyCount = local.faculties_and_programmes?.length ?? 0;
  const apiFacultyCount = api.faculties_and_programmes?.length ?? 0;
  if (localFacultyCount !== apiFacultyCount) {
    issues.push(`faculties_and_programmes count: local=${localFacultyCount} api=${apiFacultyCount}`);
  }
  return issues;
}

async function checkInstitutions(deps: {
  allInstitutions: InstitutionRecord[];
  findLocalById: (id: string) => InstitutionRecord | undefined;
  getInstitution: (id: string) => Promise<InstitutionRecord | null>;
  getDisplayName: (name: string, tradingName?: string | null) => string;
}): Promise<{ mismatches: number; abbreviationViolations: number }> {
  const { allInstitutions, findLocalById, getInstitution, getDisplayName } = deps;
  const publicUniversities = allInstitutions.filter((i) => i.institutionType === "Public University");
  const privates = allInstitutions.filter((i) => i.institutionType === "Private Higher Education Institution").slice(0, 8);
  const tvets = allInstitutions.filter((i) => i.institutionType === "TVET College").slice(0, 5);
  const sample = [...publicUniversities, ...privates, ...tvets];

  console.log(
    `Comparing ${sample.length} institutions (${publicUniversities.length} public universities, ${privates.length} private, ${tvets.length} TVET) — local vs API...\n`
  );

  let mismatches = 0;
  let abbreviationViolations = 0;

  for (const institution of sample) {
    const local = findLocalById(institution.id) ?? null;

    let api: InstitutionRecord | null = null;
    let apiError: string | null = null;
    try {
      api = await withExternalApi(() => getInstitution(institution.id));
    } catch (error) {
      apiError = (error as Error).message;
    }

    if (apiError) {
      mismatches++;
      console.log(`[ERROR] ${institution.id} (${institution.name}): ${apiError}`);
      continue;
    }

    if (!local || !api) {
      mismatches++;
      console.log(`[MISMATCH] ${institution.id} (${institution.name}): presence local=${!!local} api=${!!api}`);
      continue;
    }

    const issues = diffRecord(local, api);
    if (issues.length > 0) {
      mismatches++;
      console.log(`[MISMATCH] ${institution.id} (${institution.name}):`);
      issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    if (institution.institutionType === "Public University") {
      const displayName = getDisplayName(api.name, api.tradingName);
      if (displayName !== institution.name) {
        abbreviationViolations++;
        console.log(`[INVARIANT VIOLATION] getDisplayName(${institution.id}) = "${displayName}", expected full name "${institution.name}"`);
      }
    }
  }

  console.log(`\nInstitution comparison: ${sample.length - mismatches}/${sample.length} matched.`);
  console.log(
    `getDisplayName invariant: ${publicUniversities.length - abbreviationViolations}/${publicUniversities.length} public universities unabbreviated.`
  );

  return { mismatches, abbreviationViolations };
}

async function checkSearch(deps: {
  searchLocal: (query: string, filters: Record<string, never>) => InstitutionRecord[];
  searchInstitutions: (query: string) => Promise<{ results: InstitutionRecord[]; notFound: boolean }>;
}): Promise<number> {
  const { searchLocal, searchInstitutions } = deps;
  console.log(`\nComparing ${SAMPLE_QUERIES.length} search queries (local vs API)...\n`);
  let mismatches = 0;

  for (const query of SAMPLE_QUERIES) {
    const localIds = new Set(searchLocal(query, {}).map((r) => r.id));

    let apiIds = new Set<string>();
    let apiError: string | null = null;
    try {
      const outcome = await withExternalApi(() => searchInstitutions(query));
      apiIds = new Set(outcome.results.map((r) => r.id));
    } catch (error) {
      apiError = (error as Error).message;
    }

    if (apiError) {
      mismatches++;
      console.log(`[ERROR] query "${query}": ${apiError}`);
      continue;
    }

    const onlyLocal = [...localIds].filter((id) => !apiIds.has(id));
    const onlyApi = [...apiIds].filter((id) => !localIds.has(id));
    if (onlyLocal.length > 0 || onlyApi.length > 0) {
      mismatches++;
      console.log(`[MISMATCH] query "${query}": local=${localIds.size} results, api=${apiIds.size} results`);
      if (onlyLocal.length) console.log(`  only in local (${onlyLocal.length}): ${onlyLocal.slice(0, 5).join(", ")}`);
      if (onlyApi.length) console.log(`  only in api (${onlyApi.length}): ${onlyApi.slice(0, 5).join(", ")}`);
    }
  }

  console.log(`\nSearch comparison: ${SAMPLE_QUERIES.length - mismatches}/${SAMPLE_QUERIES.length} queries matched exactly.`);
  return mismatches;
}

async function main() {
  // apiClient.ts reads EDUVERIFY_API_BASE_URL/EDUVERIFY_API_KEY at module load time, so
  // .env.local must be loaded before that module (or anything importing it) is loaded —
  // hence dynamic imports below, deferred until after loadEnvFile runs.
  process.loadEnvFile(process.argv[2] ?? ".env.local");

  if (!process.env.EDUVERIFY_API_BASE_URL || !process.env.EDUVERIFY_API_KEY) {
    console.error("EDUVERIFY_API_BASE_URL / EDUVERIFY_API_KEY not set (expected in web/.env.local). Aborting.");
    process.exit(1);
  }

  const { ALL_INSTITUTIONS, findLocalById } = await import("../lib/localData");
  const { getInstitution, searchInstitutions } = await import("../lib/institutions");
  const { getDisplayName } = await import("../lib/presentation");
  const { searchLocal } = await import("../lib/search");

  const { mismatches, abbreviationViolations } = await checkInstitutions({
    allInstitutions: ALL_INSTITUTIONS,
    findLocalById,
    getInstitution,
    getDisplayName,
  });
  const queryMismatches = await checkSearch({ searchLocal, searchInstitutions });

  const failed = mismatches > 0 || abbreviationViolations > 0 || queryMismatches > 0;
  console.log(`\n${failed ? "FAILED" : "PASSED"}`);
  process.exit(failed ? 1 : 0);
}

main();
