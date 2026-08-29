import { getJson } from "./apiClient";
import { ALL_INSTITUTIONS, findLocalById } from "./localData";
import { searchLocal } from "./search";
import type { InstitutionRecord, SearchFilters } from "./types";

/** eduverify-api hasn't run the faculties_and_programmes baking step yet (tracked
 * separately), so a record it returns may omit the field entirely. Defaults it to [] so
 * getAllProgrammes/getFacultyLabels never see undefined. */
function normalizeApiInstitution(institution: InstitutionRecord): InstitutionRecord {
  return { ...institution, faculties_and_programmes: institution.faculties_and_programmes ?? [] };
}

/** eduverify-api is the source of truth in DEV, STAGING, and PROD. Set USE_EXTERNAL_API=false
 * to fall back to the bundled local seed data instead — e.g. for offline work, or when
 * eduverify-api isn't running locally. Read per-call, not cached, so tests can toggle it
 * freely and a running server picks up an env change on next request. */
function isExternalApiEnabled(): boolean {
  return process.env.USE_EXTERNAL_API === "true";
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
  const results = (response?.results ?? []).map(normalizeApiInstitution);
  return { results, notFound: results.length === 0 };
}

/**
 * Behind `USE_EXTERNAL_API`, this calls eduverify-api and lets any error propagate — there's
 * no local fallback on that path, so an API outage is a real, user-visible outage. With the
 * flag off, this runs local fuzzy matching over the bundled seed data instead.
 */
export async function searchInstitutions(query: string, filters: SearchFilters = {}): Promise<SearchOutcome> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], notFound: false };

  if (isExternalApiEnabled()) return searchViaApi(trimmed, filters);

  const results = searchLocal(trimmed, filters);
  return { results, notFound: results.length === 0 };
}

export async function getInstitution(id: string): Promise<InstitutionRecord | null> {
  if (isExternalApiEnabled()) {
    // eduverify-api's GET /v1/institutions/{id} wraps its record in { institution } (see
    // eduverify-api/src/router.ts) rather than returning it bare.
    const response = await getJson<{ institution: InstitutionRecord }>(`/v1/institutions/${encodeURIComponent(id)}`);
    return response?.institution ? normalizeApiInstitution(response.institution) : null;
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

  // fields=full opts back into complete InstitutionRecords (with faculties_and_programmes) —
  // eduverify-api's /v1/institutions/list otherwise defaults to a lighter summary shape
  // (qualificationCount + facultyLabels, no nested detail) meant for callers that only need
  // browse-card counts. The homepage needs every SAQA-matched programme row up front (per-card
  // qualification-title matching, the qualifications explorer's global title search), and
  // fetching that one institution at a time would mean hundreds of extra round trips.
  const response = await getJson<ApiListResponse>(
    `/v1/institutions/list?status=ALL&pageSize=${FETCH_ALL_PAGE_SIZE}&fields=full`,
  );
  return (response?.institutions ?? []).map(normalizeApiInstitution);
}
