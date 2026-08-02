import { getInstitutionByPK, getInstitutionByRegistrationNumber, queryByNamePrefix } from "./dynamodb";
import { findLocalById } from "./localData";
import { searchLocal } from "./search";
import type { InstitutionRecord, SearchFilters } from "./types";

const REGISTRATION_NUMBER_PATTERN = /\d{4}\s*\/\s*[A-Za-z]{2}\s*\d{2}\s*\/\s*\d{3}/;

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

/**
 * DynamoDB is queried for exact registration-number and name-prefix matches (its GSI1SK
 * ordering is case-sensitive, so it can't do case-insensitive substring search on its own).
 * Local fuzzy matching always runs alongside it, both as a fallback when DynamoDB is
 * unreachable and to catch partial/lowercase queries DynamoDB's exact matching would miss.
 */
export async function searchInstitutions(query: string, filters: SearchFilters = {}): Promise<SearchOutcome> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], notFound: false };

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
  try {
    const institution = await getInstitutionByPK(id);
    if (institution) return institution;
  } catch (error) {
    console.warn("[eduverify] DynamoDB lookup unavailable, using local data only:", (error as Error).message);
  }

  return findLocalById(id) ?? null;
}
