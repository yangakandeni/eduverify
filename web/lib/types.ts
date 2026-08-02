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
}

export interface Institution {
  name: string;
  tradingName?: string | null;
  registration_number?: string | null;
  status?: string | null;
  address: string;
  province?: string | null;
  contacts: Contacts;
  qualifications: Qualification[];
  institutionType: InstitutionType;
}

export interface InstitutionRecord extends Institution {
  id: string;
}

export interface SearchFilters {
  province?: string;
  institutionType?: InstitutionType;
}
