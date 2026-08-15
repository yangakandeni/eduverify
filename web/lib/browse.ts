import { getStatusBadge } from "./presentation";
import type { InstitutionRecord, InstitutionType } from "./types";

/** Sentinel select-option values for "no filter applied" — kept as plain empty strings
 * (rather than undefined) so they bind directly to a controlled <select>'s value. */
export const ALL_PROVINCES_VALUE = "";
export const ALL_TYPES_VALUE = "";
export const ALL_STATUSES_VALUE = "";

export interface BrowseFilters {
  province: string;
  institutionType: string;
  status: string;
}

/** Most of the register only ever yields these two statuses — lapsed/bogus institutions
 * are dropped during parsing (see parser/pdf_extract.py) rather than kept with a
 * "deregistered" status. A "Cancelled" status does occur (see getStatusBadge) but has
 * no filter option of its own here: cancelled institutions are excluded from both
 * buckets below rather than folded into "Provisionally Registered", so they only
 * surface when no status filter is applied. */
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "registered", label: "Registered" },
  { value: "provisional", label: "Provisionally Registered" },
];

export function filterInstitutionsForBrowse(
  institutions: InstitutionRecord[],
  filters: BrowseFilters
): InstitutionRecord[] {
  return institutions.filter((institution) => {
    if (filters.province !== ALL_PROVINCES_VALUE && institution.province !== filters.province) return false;
    if (filters.institutionType !== ALL_TYPES_VALUE && institution.institutionType !== filters.institutionType) {
      return false;
    }
    if (filters.status !== ALL_STATUSES_VALUE) {
      const badge = getStatusBadge(institution);
      if (badge.cancelled) return false;
      if (filters.status === "registered" && !badge.verified) return false;
      if (filters.status === "provisional" && badge.verified) return false;
    }
    return true;
  });
}

export function getResultCountLabel(count: number): string {
  return `${count} institution${count === 1 ? "" : "s"} found`;
}

export function getBrowseTitle(query?: string): string {
  return query ? `Results for "${query}"` : "Browse All Institutions";
}

export function getEmptyStateHeading(): string {
  return "No institutions found";
}

export function getEmptyStateDetail(query?: string): string {
  return query
    ? `"${query}" wasn't found in the current dataset.`
    : "No institutions match these filters yet.";
}

export const INSTITUTION_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "Public University", label: "Public University" },
  { value: "Private Higher Education Institution", label: "Private Institution" },
  { value: "TVET College", label: "TVET College" },
];
