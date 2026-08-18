import { getAllProgrammes } from "./facultiesAndProgrammes";
import { ALL_INSTITUTIONS } from "./localData";
import { CANONICAL_PROVINCES, normalizeRegistrationNumber, normalizeText } from "./normalize";
import { matchesQualificationSearch } from "./qualificationSearch";
import type { InstitutionRecord, SearchFilters } from "./types";

function matchesFilters(institution: InstitutionRecord, filters: SearchFilters): boolean {
  if (filters.province && institution.province !== filters.province) return false;
  if (filters.institutionType && institution.institutionType !== filters.institutionType) return false;
  return true;
}

const NORMALIZED_PROVINCES = CANONICAL_PROVINCES.map((province) => ({ province, normalized: normalizeText(province) }));

/** Institution name / abbreviation / registration-number scoring, shared by searchLocal's
 * ranking and by institutionNameMatches' plain boolean check below. */
function institutionNameScore(institution: InstitutionRecord, q: string, qReg: string): number {
  const name = normalizeText(institution.name);
  const abbreviation = institution.abbreviation ? normalizeText(institution.abbreviation) : "";
  const reg = institution.registration_number ? normalizeRegistrationNumber(institution.registration_number) : "";

  if (reg && reg === qReg) return 100;
  if (abbreviation && abbreviation === q) return 95;
  if (name === q) return 90;
  if (reg && qReg.length >= 3 && reg.includes(qReg)) return 80;
  if (name.startsWith(q)) return 70;
  if (abbreviation && q.length >= 2 && abbreviation.startsWith(q)) return 65;
  if (name.split(" ").some((word) => word.startsWith(q))) return 55;
  if (q.length >= 3 && name.includes(q)) return 40;
  return 0;
}

/** True when a query identifies this institution by name/abbreviation/registration number,
 * as opposed to matching one of its qualifications or its province. Used to decide whether
 * a search term should carry over into the institution's qualifications page (it should only
 * carry over when the query actually matched a qualification, not the institution itself). */
export function institutionNameMatches(institution: InstitutionRecord, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return false;
  const qReg = normalizeRegistrationNumber(query);
  return institutionNameScore(institution, q, qReg) > 0;
}

/** Query intent is "province" when it names (or is named by) a canonical province, e.g. "Western Cape". */
function matchProvinceQuery(q: string): string | undefined {
  const match = NORMALIZED_PROVINCES.find(
    ({ normalized }) => normalized === q || normalized.includes(q) || q.includes(normalized)
  );
  return match?.province;
}

/**
 * Fuzzy/partial matching over the bundled seed data. Used as a fallback when DynamoDB
 * is unreachable, and as the primary source for fast client-side typeahead suggestions.
 *
 * Supports four search intents, ranked so a strong institution-name match always wins
 * over a qualification or province match (e.g. "Cape College" surfaces Cape Audio College
 * ahead of every other Western-Cape institution that merely offers "Cape"-titled courses):
 *   - Institution name / registration number / common abbreviation (score 40-100)
 *   - Qualification title, e.g. "Computer Science" (score 20-38, scaled by match count)
 *   - Province name, e.g. "Western Cape" (score 15)
 */
export function searchLocal(query: string, filters: SearchFilters = {}, limit = 24): InstitutionRecord[] {
  const q = normalizeText(query);
  const qReg = normalizeRegistrationNumber(query);
  if (!q) return [];

  const qProvince = q.length >= 4 ? matchProvinceQuery(q) : undefined;

  const scored: Array<{ institution: InstitutionRecord; score: number }> = [];

  for (const institution of ALL_INSTITUTIONS) {
    if (!matchesFilters(institution, filters)) continue;

    let score = institutionNameScore(institution, q, qReg);

    if (score === 0 && q.length >= 2) {
      const qualMatches = getAllProgrammes(institution).filter((qualification) =>
        matchesQualificationSearch(qualification.title, query)
      ).length;
      if (qualMatches > 0) score = Math.min(38, 20 + qualMatches * 3);
    }

    if (score === 0 && qProvince && institution.province === qProvince) {
      score = 15;
    }

    if (score > 0) scored.push({ institution, score });
  }

  scored.sort((a, b) => b.score - a.score || a.institution.name.localeCompare(b.institution.name));
  return scored.slice(0, limit).map((entry) => entry.institution);
}
