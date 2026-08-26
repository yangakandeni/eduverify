import raw from "../../data/institutions.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import { loadPublicUniversities } from "./publicUniversities";
import { loadPublicTvets } from "./publicTvets";
import type { InstitutionRecord, RawInstitution } from "./types";

const institutions = raw as RawInstitution[];

const privateInstitutions: InstitutionRecord[] = institutions.map((institution) => ({
  ...institution,
  id: institutionKey(institution),
  province: normalizeProvince(institution.province),
  institutionType: "Private Higher Education Institution",
}));

/** The DHET register sometimes lists the same institution under more than one section
 * (e.g. an earlier "Cancelled" tabular entry and a later "Discontinued" name-list entry) —
 * dedupe by id keeping the last occurrence, since document order tracks section order and
 * later sections are the more terminal/current status. */
function dedupeById(records: InstitutionRecord[]): InstitutionRecord[] {
  const byId = new Map<string, InstitutionRecord>();
  for (const record of records) {
    byId.set(record.id, record);
  }
  return Array.from(byId.values());
}

export const ALL_INSTITUTIONS: InstitutionRecord[] = dedupeById([
  ...privateInstitutions,
  ...loadPublicUniversities(),
  ...loadPublicTvets(),
]);

export function findLocalById(id: string): InstitutionRecord | undefined {
  return ALL_INSTITUTIONS.find((institution) => institution.id === id);
}
