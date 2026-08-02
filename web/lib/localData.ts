import raw from "@/data/institutions.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import { parseQualification } from "./qualifications";
import { loadPublicUniversities } from "./publicUniversities";
import type { InstitutionRecord, RawInstitution } from "./types";

const institutions = raw as RawInstitution[];

const privateInstitutions: InstitutionRecord[] = institutions.map((institution) => ({
  ...institution,
  id: institutionKey(institution),
  province: normalizeProvince(institution.province),
  institutionType: "Private Higher Education Institution",
  qualifications: institution.qualifications.map(parseQualification),
}));

export const ALL_INSTITUTIONS: InstitutionRecord[] = [...privateInstitutions, ...loadPublicUniversities()];

export function findLocalById(id: string): InstitutionRecord | undefined {
  return ALL_INSTITUTIONS.find((institution) => institution.id === id);
}
