import { describe, expect, it } from "vitest";
import { ALL_INSTITUTIONS } from "./localData";
import {
  getFacultiesForInstitution,
  getFacultyQualificationGroups,
  getQualificationsForInstitutionFaculty,
  searchQualificationsGlobal,
} from "./qualificationsData";
import type { InstitutionRecord, InstitutionType } from "./types";

function requireInstitutionByName(name: string): InstitutionRecord {
  const institution = ALL_INSTITUTIONS.find((candidate) => candidate.name === name);
  if (!institution) throw new Error(`Expected fixture institution "${name}" to exist in ALL_INSTITUTIONS`);
  return institution;
}

function requireInstitutionByType(institutionType: InstitutionType): InstitutionRecord {
  const institution = ALL_INSTITUTIONS.find((candidate) => candidate.institutionType === institutionType);
  if (!institution) throw new Error(`Expected a fixture institution of type "${institutionType}" to exist`);
  return institution;
}

describe("getFacultiesForInstitution", () => {
  it("groups Stellenbosch University's SAQA qualifications by faculty (subfield)", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const faculties = getFacultiesForInstitution(stellenbosch.id);

    expect(faculties.length).toBeGreaterThan(0);
    expect(faculties.map((f) => f.faculty)).toContain("Visual Arts");
    for (const faculty of faculties) {
      expect(faculty.count).toBeGreaterThan(0);
    }
  });

  it("returns an empty list for an institution with no matched SAQA qualifications", () => {
    const tvet = requireInstitutionByType("TVET College");
    expect(getFacultiesForInstitution(tvet.id)).toEqual([]);
  });

  it("returns an empty list for an unknown institution id", () => {
    expect(getFacultiesForInstitution("does-not-exist")).toEqual([]);
  });
});

describe("getQualificationsForInstitutionFaculty", () => {
  it("filters to only the given faculty", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const visualArts = getQualificationsForInstitutionFaculty(stellenbosch.id, "Visual Arts");

    expect(visualArts.length).toBeGreaterThan(0);
    for (const qualification of visualArts) {
      expect(qualification.subfield).toBe("Visual Arts");
    }
  });

  it("returns every matched qualification when no faculty is given", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const all = getQualificationsForInstitutionFaculty(stellenbosch.id);
    const visualArts = getQualificationsForInstitutionFaculty(stellenbosch.id, "Visual Arts");

    expect(all.length).toBeGreaterThanOrEqual(visualArts.length);
  });
});

describe("getFacultyQualificationGroups", () => {
  it("attaches each faculty's own qualifications alongside its count, matching getFacultiesForInstitution's ordering", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const groups = getFacultyQualificationGroups(stellenbosch.id);
    const faculties = getFacultiesForInstitution(stellenbosch.id);

    expect(groups.map((g) => g.faculty)).toEqual(faculties.map((f) => f.faculty));

    for (const group of groups) {
      expect(group.qualifications.length).toBe(group.count);
      for (const qualification of group.qualifications) {
        expect(qualification.subfield).toBe(group.faculty);
      }
    }
  });

  it("returns an empty list for an institution with no matched SAQA qualifications", () => {
    const tvet = requireInstitutionByType("TVET College");
    expect(getFacultyQualificationGroups(tvet.id)).toEqual([]);
  });
});

describe("searchQualificationsGlobal", () => {
  it("finds a qualification by keyword and returns its owning institution", () => {
    const hits = searchQualificationsGlobal("theatre");

    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.qualification.title.toLowerCase()).toContain("theatre");
      expect(hit.institution.id).toBeTruthy();
    }
  });

  it("returns no more than the requested limit", () => {
    const hits = searchQualificationsGlobal("certificate", 5);
    expect(hits.length).toBeLessThanOrEqual(5);
  });

  it("returns an empty array for an empty query", () => {
    expect(searchQualificationsGlobal("")).toEqual([]);
  });
});
