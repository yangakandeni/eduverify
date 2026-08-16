import { getAllProgrammes } from "./facultiesAndProgrammes";
import { ALL_INSTITUTIONS, findLocalById } from "./localData";
import { normalizeText } from "./normalize";
import type { FacultyGroup, InstitutionRecord, SaqaQualification } from "./types";

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
      else if (title.includes(q)) score = 40;

      if (score > 0) scored.push({ hit: { qualification, institution }, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.hit.qualification.title.localeCompare(b.hit.qualification.title));
  return scored.slice(0, limit).map((entry) => entry.hit);
}
