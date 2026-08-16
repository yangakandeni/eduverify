import raw from "../../data/qualifications.json";
import { ALL_INSTITUTIONS, findLocalById } from "./localData";
import { normalizeText } from "./normalize";
import { matchQualificationsToInstitutions } from "./qualificationsMatching";
import type { FacultyGroup, InstitutionRecord, SaqaQualification } from "./types";

const QUALIFICATIONS_BY_INSTITUTION = matchQualificationsToInstitutions(
  ALL_INSTITUTIONS,
  raw as SaqaQualification[],
);

export function getFacultiesForInstitution(institutionId: string): FacultyGroup[] {
  const qualifications = QUALIFICATIONS_BY_INSTITUTION.get(institutionId) ?? [];

  const counts = new Map<string, number>();
  for (const qualification of qualifications) {
    counts.set(qualification.subfield, (counts.get(qualification.subfield) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([faculty, count]) => ({ faculty, count }))
    .sort((a, b) => a.faculty.localeCompare(b.faculty));
}

export function getQualificationsForInstitutionFaculty(
  institutionId: string,
  faculty?: string,
): SaqaQualification[] {
  const qualifications = QUALIFICATIONS_BY_INSTITUTION.get(institutionId) ?? [];
  if (!faculty) return qualifications;
  return qualifications.filter((qualification) => qualification.subfield === faculty);
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

  for (const [institutionId, qualifications] of QUALIFICATIONS_BY_INSTITUTION) {
    const institution = findLocalById(institutionId);
    if (!institution) continue;

    for (const qualification of qualifications) {
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
