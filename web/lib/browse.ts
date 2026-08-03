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

/** The DHET register export only ever yields these two statuses — lapsed/cancelled/bogus
 * institutions are dropped during parsing (see parser/pdf_extract.py) rather than kept
 * with a "deregistered" status, so there is no such option to filter by here. */
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
      const verified = getStatusBadge(institution).verified;
      if (filters.status === "registered" && !verified) return false;
      if (filters.status === "provisional" && verified) return false;
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
  return query ? `` : "No institutions match these filters yet.";
}

export const INSTITUTION_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "Public University", label: "Public University" },
  { value: "Private Higher Education Institution", label: "Private Institution" },
  { value: "TVET College", label: "TVET College" },
];
