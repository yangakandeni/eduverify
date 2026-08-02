import raw from "@/data/institutions.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import type { Institution, InstitutionRecord } from "./types";

const institutions = raw as Institution[];

export const ALL_INSTITUTIONS: InstitutionRecord[] = institutions.map((institution) => ({
  ...institution,
  id: institutionKey(institution),
  province: normalizeProvince(institution.province),
}));

export function findLocalById(id: string): InstitutionRecord | undefined {
  return ALL_INSTITUTIONS.find((institution) => institution.id === id);
}
