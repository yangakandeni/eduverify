import raw from "./data/public_tvets.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import type { FacultyProgrammes, Institution, InstitutionRecord } from "./types";

interface RawPublicTvet {
  name: string;
  abbreviation: string;
  address: string;
  province: string;
  website: string;
  faculties_and_programmes: FacultyProgrammes[];
}

const tvets = raw as RawPublicTvet[];

export function loadPublicTvets(): InstitutionRecord[] {
  return tvets.map((tvet) => {
    const institution: Institution = {
      name: tvet.name,
      abbreviation: tvet.abbreviation,
      registration_number: null,
      status: "Established — Continuing Education and Training Act",
      address: tvet.address,
      province: normalizeProvince(tvet.province),
      contacts: { email: [], phone: [], website: tvet.website },
      faculties_and_programmes: tvet.faculties_and_programmes,
      institutionType: "TVET College",
    };

    return { ...institution, id: institutionKey(institution) };
  });
}
