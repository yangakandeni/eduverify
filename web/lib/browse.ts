import type { InstitutionRecord, InstitutionType } from "./types";

/** Sentinel select-option values for "no filter applied" — kept as plain empty strings
 * (rather than undefined) so they bind directly to a controlled <select>'s value. */
export const ALL_PROVINCES_VALUE = "";
export const ALL_TYPES_VALUE = "";

export interface BrowseFilters {
  province: string;
  institutionType: string;
}

export function filterInstitutionsForBrowse(
  institutions: InstitutionRecord[],
  filters: BrowseFilters
): InstitutionRecord[] {
  return institutions.filter((institution) => {
    if (filters.province !== ALL_PROVINCES_VALUE && institution.province !== filters.province) return false;
    if (filters.institutionType !== ALL_TYPES_VALUE && institution.institutionType !== filters.institutionType) {
      return false;
    }
    return true;
  });
}

export function getResultCountLabel(count: number): string {
  return `${count} institution${count === 1 ? "" : "s"} found`;
}

export const INSTITUTION_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "Public University", label: "Public University" },
  { value: "Private Higher Education Institution", label: "Private Institution" },
  { value: "TVET College", label: "TVET College" },
];
