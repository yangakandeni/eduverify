import { getJson } from "./apiClient";
import { getInstitutionByPK, getInstitutionByRegistrationNumber, queryByNamePrefix } from "./dynamodb";
import { ALL_INSTITUTIONS, findLocalById } from "./localData";
import { searchLocal } from "./search";
import type { InstitutionRecord, SearchFilters } from "./types";

const REGISTRATION_NUMBER_PATTERN = /\d{4}\s*\/\s*[A-Za-z]{2}\s*\d{2}\s*\/\s*\d{3}/;

/** Rollout flag for the eduverify-api cutover (Part 3 of the monetization plan) — staging
 * runs the API path while production still reads DynamoDB/local directly, until the parity
 * check and hero/browse rework are done. Read per-call, not cached, so tests can toggle it
 * freely and a running server picks up an env change on next request. */
function isExternalApiEnabled(): boolean {
  return process.env.USE_EXTERNAL_API === "true";
}

function dedupeById(institutions: InstitutionRecord[]): InstitutionRecord[] {
  const seen = new Map<string, InstitutionRecord>();
  for (const institution of institutions) {
    if (!seen.has(institution.id)) seen.set(institution.id, institution);
  }
  return [...seen.values()];
}

function applyFilters(institutions: InstitutionRecord[], filters: SearchFilters): InstitutionRecord[] {
  return institutions.filter((institution) => {
    if (filters.province && institution.province !== filters.province) return false;
    if (filters.institutionType && institution.institutionType !== filters.institutionType) return false;
    return true;
  });
}

async function queryDynamo(query: string): Promise<InstitutionRecord[]> {
  const hits: InstitutionRecord[] = [];

  if (REGISTRATION_NUMBER_PATTERN.test(query)) {
    const exact = await getInstitutionByRegistrationNumber(query.trim());
    if (exact) hits.push(exact);
  }

  const prefixHits = await queryByNamePrefix(query.trim());
  hits.push(...prefixHits);

  return hits;
}

export interface SearchOutcome {
  results: InstitutionRecord[];
  notFound: boolean;
}

/** eduverify-api's GET /v1/institutions/search wraps its array in { query, results }
 * (see eduverify-api/src/handlers/institutions.ts's searchInstitutionsHandler). */
interface ApiSearchResponse {
  query: string;
  results: InstitutionRecord[];
}

async function searchViaApi(query: string, filters: SearchFilters): Promise<SearchOutcome> {
  const params = new URLSearchParams({ q: query });
  if (filters.province) params.set("province", filters.province);
  if (filters.institutionType) params.set("type", filters.institutionType);

  const response = await getJson<ApiSearchResponse>(`/v1/institutions/search?${params.toString()}`);
  const results = response?.results ?? [];
  return { results, notFound: results.length === 0 };
}

/**
 * DynamoDB is queried for exact registration-number and name-prefix matches (its GSI1SK
 * ordering is case-sensitive, so it can't do case-insensitive substring search on its own).
 * Local fuzzy matching always runs alongside it, both as a fallback when DynamoDB is
 * unreachable and to catch partial/lowercase queries DynamoDB's exact matching would miss.
 *
 * Behind `USE_EXTERNAL_API`, this instead calls eduverify-api and lets any error propagate —
 * there's no local fallback on that path, so an API outage is a real, user-visible outage.
 */
export async function searchInstitutions(query: string, filters: SearchFilters = {}): Promise<SearchOutcome> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], notFound: false };

  if (isExternalApiEnabled()) return searchViaApi(trimmed, filters);

  let dynamoHits: InstitutionRecord[] = [];
  try {
    dynamoHits = await queryDynamo(trimmed);
  } catch (error) {
    console.warn("[eduverify] DynamoDB search unavailable, using local data only:", (error as Error).message);
  }

  const localHits = searchLocal(trimmed, filters);
  const combined = applyFilters(dedupeById([...dynamoHits, ...localHits]), filters);

  return { results: combined, notFound: combined.length === 0 };
}

export async function getInstitution(id: string): Promise<InstitutionRecord | null> {
  if (isExternalApiEnabled()) {
    // eduverify-api's GET /v1/institutions/{id} wraps its record in { institution } (see
    // eduverify-api/src/router.ts) rather than returning it bare.
    const response = await getJson<{ institution: InstitutionRecord }>(`/v1/institutions/${encodeURIComponent(id)}`);
    return response?.institution ?? null;
  }

  try {
    const institution = await getInstitutionByPK(id);
    if (institution) return institution;
  } catch (error) {
    console.warn("[eduverify] DynamoDB lookup unavailable, using local data only:", (error as Error).message);
  }

  return findLocalById(id) ?? null;
}

/** eduverify-api's GET /v1/institutions/list wraps its page in { institutions, page,
 * pageSize, total } (see eduverify-api/src/handlers/institutions.ts's listInstitutions). */
interface ApiListResponse {
  institutions: InstitutionRecord[];
}

/** Homepage/browse still need "every institution, every status" up front (ALL_INSTITUTIONS's
 * scope) rather than a genuinely paginated fetch — real server-side pagination/ranking for
 * the hero and browse grid is future work; this is the minimal cutover that gets EduVerify's
 * homepage reading from the API instead of a bundled array. `status=ALL` + a pageSize larger
 * than the whole dataset (~460 institutions today) fetches everything in one call; revisit if
 * the dataset grows enough for that to stop being cheap. */
const FETCH_ALL_PAGE_SIZE = 1000;

export async function getAllInstitutions(): Promise<InstitutionRecord[]> {
  if (!isExternalApiEnabled()) return ALL_INSTITUTIONS;

  const response = await getJson<ApiListResponse>(`/v1/institutions/list?status=ALL&pageSize=${FETCH_ALL_PAGE_SIZE}`);
  return response?.institutions ?? [];
}
