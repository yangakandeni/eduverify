export type InstitutionType =
  | "Public University"
  | "Private Higher Education Institution"
  | "TVET College";

export interface Contacts {
  email: string[];
  phone: string[];
  website?: string | null;
}

/** An institution's SAQA-matched qualifications, grouped by subfield ("faculty"). Baked
 * into data/institutions.json / public_universities.json / public_tvets.json by
 * web/scripts/bakeFacultiesAndProgrammes.ts — an institution/faculty with no SAQA match
 * gets an empty array, never omitted or null. */
export interface FacultyProgrammes {
  faculty: string;
  programmes: SaqaQualification[];
}

/** Shape of the seed data — already enriched with SAQA-matched faculties_and_programmes
 * by the bake script, so no client-side parsing is needed. */
export interface RawInstitution {
  name: string;
  registration_number?: string | null;
  status?: string | null;
  address: string;
  province?: string | null;
  contacts: Contacts;
  faculties_and_programmes: FacultyProgrammes[];
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
  faculties_and_programmes: FacultyProgrammes[];
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

/** A single SAQA NLRD qualification registration, in data/qualifications.json (which carries
 * every NQF sub-framework, not just HEQSF — see `framework`). EduVerify's own bake script
 * (web/scripts/bakeFacultiesAndProgrammes.ts) filters to HEQSF only, since that's the only
 * sub-framework relevant to its higher-education product. */
export interface SaqaQualification {
  qualId: number;
  title: string;
  nqfLevel?: number;
  nqfLevelRaw: string;
  credits?: number;
  subfield: string;
  originator: string;
  framework: string;
}

export interface FacultyGroup {
  faculty: string;
  count: number;
}

export interface FacultyQualificationGroup extends FacultyGroup {
  qualifications: SaqaQualification[];
}
