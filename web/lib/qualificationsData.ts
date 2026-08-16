import { getAllProgrammes } from "./facultiesAndProgrammes";
import { ALL_INSTITUTIONS, findLocalById } from "./localData";
import { normalizeText } from "./normalize";
import type { FacultyGroup, FacultyQualificationGroup, InstitutionRecord, SaqaQualification } from "./types";

export function getFacultiesForInstitution(institutionId: string): FacultyGroup[] {
  const institution = findLocalById(institutionId);
  if (!institution) return [];

  return institution.faculties_and_programmes
    .map((faculty) => ({ faculty: faculty.faculty, count: faculty.programmes.length }))
    .sort((a, b) => a.faculty.localeCompare(b.faculty));
}

export function getQualificationsForInstitutionFaculty(
  institutionId: string,
  faculty?: string,
): SaqaQualification[] {
  const institution = findLocalById(institutionId);
  if (!institution) return [];
  if (!faculty) return getAllProgrammes(institution);
  return institution.faculties_and_programmes.find((f) => f.faculty === faculty)?.programmes ?? [];
}

/** Each faculty paired with its own qualifications, for pages that need both up front
 * (e.g. client-side faculty switching with no per-selection refetch). Composes the two
 * functions above rather than re-deriving from findLocalById/getAllProgrammes directly, so
 * ordering and matching stay in one place. */
export function getFacultyQualificationGroups(institutionId: string): FacultyQualificationGroup[] {
  return getFacultiesForInstitution(institutionId).map((group) => ({
    ...group,
    qualifications: getQualificationsForInstitutionFaculty(institutionId, group.faculty),
  }));
}

/** Sentinel faculty name for the "show everything" view in the qualifications explorer's
 * sidebar — not a real faculty, so it never appears in getFacultiesForInstitution's output. */
export const ALL_QUALIFICATIONS_FACULTY = "All Qualifications";

/** Picks the faculty a qualifications explorer should show initially: the requested one if
 * it actually exists among the groups, otherwise ALL_QUALIFICATIONS_FACULTY so a user who
 * doesn't know which faculty a qualification falls under can still search/browse everything. */
export function resolveInitialFaculty(
  groups: FacultyQualificationGroup[],
  requested?: string,
): string | undefined {
  if (groups.length === 0) return undefined;
  if (requested && groups.some((group) => group.faculty === requested)) return requested;
  return ALL_QUALIFICATIONS_FACULTY;
}

export interface QualificationSearchHit {
  qualification: SaqaQualification;
  institution: InstitutionRecord;
}

/** Keyword search over every matched SAQA qualification's title, tiered like
 * search.ts's institution scoring (exact > startsWith > includes). Only
 * qualifications already matched to a recognized institution are searched. */
export function searchQualificationsGlobal(query: string, limit = 20): QualificationSearchHit[] {
  const q = normalizeText(query);
  if (!q) return [];

  const scored: Array<{ hit: QualificationSearchHit; score: number }> = [];

  for (const institution of ALL_INSTITUTIONS) {
    for (const qualification of getAllProgrammes(institution)) {
      const title = normalizeText(qualification.title);

      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 70;
      else if (title.split(" ").some((word) => word.startsWith(q))) score = 55;
      else if (q.length >= 3 && title.includes(q)) score = 40;

      if (score > 0) scored.push({ hit: { qualification, institution }, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.hit.qualification.title.localeCompare(b.hit.qualification.title));
  return scored.slice(0, limit).map((entry) => entry.hit);
}
