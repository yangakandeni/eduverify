import raw from "@/data/institutions.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import { parseQualification } from "./qualifications";
import { loadPublicUniversities } from "./publicUniversities";
import { loadPublicTvets } from "./publicTvets";
import type { InstitutionRecord, RawInstitution } from "./types";

const institutions = raw as RawInstitution[];

const privateInstitutions: InstitutionRecord[] = institutions.map((institution) => ({
  ...institution,
  id: institutionKey(institution),
  province: normalizeProvince(institution.province),
  institutionType: "Private Higher Education Institution",
  qualifications: institution.qualifications.map(parseQualification),
}));

/** The DHET scrape occasionally repeats an entire row verbatim (same registration
 * number and all) — dedupe once here so every consumer gets a clean, unique-by-id list. */
function dedupeById(records: InstitutionRecord[]): InstitutionRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => (seen.has(record.id) ? false : (seen.add(record.id), true)));
}

export const ALL_INSTITUTIONS: InstitutionRecord[] = dedupeById([
  ...privateInstitutions,
  ...loadPublicUniversities(),
  ...loadPublicTvets(),
]);

export function findLocalById(id: string): InstitutionRecord | undefined {
  return ALL_INSTITUTIONS.find((institution) => institution.id === id);
}
