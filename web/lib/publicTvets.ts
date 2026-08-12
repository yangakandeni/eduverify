import raw from "./data/public_tvets.json";
import { institutionKey } from "./keys";
import { normalizeProvince } from "./normalize";
import type { Institution, InstitutionRecord, Qualification } from "./types";

interface RawPublicTvet {
  name: string;
  abbreviation: string;
  address: string;
  province: string;
  website: string;
  qualifications: Array<{ title: string; nqfLevel: number }>;
}

const tvets = raw as RawPublicTvet[];

export function loadPublicTvets(): InstitutionRecord[] {
  return tvets.map((tvet) => {
    const qualifications: Qualification[] = tvet.qualifications.map((qualification) => ({
      title: qualification.title,
      nqfLevel: qualification.nqfLevel,
    }));

    const institution: Institution = {
      name: tvet.name,
      abbreviation: tvet.abbreviation,
      registration_number: null,
      status: "Established — Continuing Education and Training Act",
      address: tvet.address,
      province: normalizeProvince(tvet.province),
      contacts: { email: [], phone: [], website: tvet.website },
      qualifications,
      institutionType: "TVET College",
    };

    return { ...institution, id: institutionKey(institution) };
  });
}
