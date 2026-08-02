export interface Contacts {
  email: string[];
  phone: string[];
  website?: string | null;
}

export interface Institution {
  name: string;
  registration_number?: string | null;
  status?: string | null;
  address: string;
  province?: string | null;
  contacts: Contacts;
  qualifications: string[];
}

export interface InstitutionRecord extends Institution {
  id: string;
}

export interface SearchFilters {
  province?: string;
  status?: string;
}
