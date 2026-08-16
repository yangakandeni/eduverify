import raw from "./data/public_universities.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import type { FacultyProgrammes, Institution, InstitutionRecord } from "./types";

interface RawPublicUniversity {
  name: string;
  abbreviation: string;
  address: string;
  province: string;
  website: string;
  faculties_and_programmes: FacultyProgrammes[];
}

const universities = raw as RawPublicUniversity[];

export function loadPublicUniversities(): InstitutionRecord[] {
  return universities.map((university) => {
    const institution: Institution = {
      name: university.name,
      abbreviation: university.abbreviation,
      registration_number: null,
      status: "Established — Higher Education Act",
      address: university.address,
      province: normalizeProvince(university.province),
      contacts: { email: [], phone: [], website: university.website },
      faculties_and_programmes: university.faculties_and_programmes,
      institutionType: "Public University",
    };

    return { ...institution, id: institutionKey(institution) };
  });
}
