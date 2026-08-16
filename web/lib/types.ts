export type InstitutionType =
  | "Public University"
  | "Private Higher Education Institution"
  | "TVET College";

export interface Qualification {
  title: string;
  nqfLevel?: number;
  credits?: number;
  mode?: string;
  saqaId?: string;
  campuses?: string;
}

export interface Contacts {
  email: string[];
  phone: string[];
  website?: string | null;
}

/** Shape of the raw scraped DHET seed data, before qualification strings are parsed. */
export interface RawInstitution {
  name: string;
  registration_number?: string | null;
  status?: string | null;
  address: string;
  province?: string | null;
  contacts: Contacts;
  qualifications: string[];
  cancellation_reason?: string | null;
}

export interface Institution {
  name: string;
  tradingName?: string | null;
  /** Common short form, e.g. "UCT" — search-only, never a valid getDisplayName result. */
  abbreviation?: string | null;
  registration_number?: string | null;
  status?: string | null;
  address: string;
  province?: string | null;
  contacts: Contacts;
  qualifications: Qualification[];
  cancellation_reason?: string | null;
  institutionType: InstitutionType;
  isFeatured?: boolean;
  isSponsored?: boolean;
  isRecentlyAdded?: boolean;
}

export interface InstitutionRecord extends Institution {
  id: string;
}

export interface SearchFilters {
  province?: string;
  institutionType?: InstitutionType;
}

/** A single SAQA NLRD qualification registration (HEQSF sub-framework only),
 * produced by parser/fetch_and_parse_qualifications.py into data/qualifications.json. */
export interface SaqaQualification {
  qualId: number;
  title: string;
  nqfLevel?: number;
  nqfLevelRaw: string;
  credits?: number;
  subfield: string;
  originator: string;
}

export interface FacultyGroup {
  faculty: string;
  count: number;
}
