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

/** Registered/Provisionally Registered cover most of the register; the remaining three
 * options surface institutions the DHET register flags as no longer (or never)
 * legitimately registered — cancelled, self-discontinued, or an outright "bogus college"
 * warning listing (see getStatusBadge and parser/pdf_extract.py's section 3-6 handling). */
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "registered", label: "Registered" },
  { value: "provisional", label: "Provisionally Registered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "discontinued", label: "Discontinued" },
  { value: "bogus", label: "Fake - Not Registered" },
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
      if (filters.status === "cancelled") return badge.label === "Cancelled";
      if (filters.status === "discontinued") return badge.label === "Discontinued";
      if (filters.status === "bogus") return badge.label === "Fake - Not Registered";
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

/** Distinct from getEmptyStateHeading/Detail — a real API outage isn't "no matches," and
 * conflating the two would tell a user their query genuinely has no results when the
 * verification service just couldn't be reached. */
export function getServiceUnavailableHeading(): string {
  return "Service temporarily unavailable";
}

export function getServiceUnavailableDetail(): string {
  return "We're having trouble reaching the verification service right now. Please try again shortly.";
}

export const INSTITUTION_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "Public University", label: "Public University" },
  { value: "Private Higher Education Institution", label: "Private Institution" },
  { value: "TVET College", label: "TVET College" },
];

export function isProvinceFilterDisabled(status: string): boolean {
  return status === "bogus";
}

/** Public University and TVET College records are never given a status other than
 * "Registered" by any data path (see web/lib/publicUniversities.ts, publicTvets.ts,
 * dynamodb.ts, and getStatusBadge's fallthrough in presentation.ts) — the other status
 * options can never match one of these types, so they're disabled rather than offered. */
export function isStatusOptionValidForType(statusValue: string, institutionType: string): boolean {
  if (institutionType !== "Public University" && institutionType !== "TVET College") return true;
  return statusValue === "registered";
}
