import raw from "./data/public_universities.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import type { Institution, InstitutionRecord, Qualification } from "./types";

interface RawPublicUniversity {
  name: string;
  abbreviation: string;
  address: string;
  province: string;
  website: string;
  degrees: Array<{ title: string; nqfLevel: number }>;
}

const universities = raw as RawPublicUniversity[];

export function loadPublicUniversities(): InstitutionRecord[] {
  return universities.map((university) => {
    const qualifications: Qualification[] = university.degrees.map((degree) => ({
      title: degree.title,
      nqfLevel: degree.nqfLevel,
    }));

    const institution: Institution = {
      name: university.name,
      abbreviation: university.abbreviation,
      registration_number: null,
      status: "Established — Higher Education Act",
      address: university.address,
      province: normalizeProvince(university.province),
      contacts: { email: [], phone: [], website: university.website },
      qualifications,
      institutionType: "Public University",
    };

    return { ...institution, id: institutionKey(institution) };
  });
}
