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
    const faculties = getFacultiesForInstitution(stellenbosch);

    expect(faculties.length).toBeGreaterThan(0);
    expect(faculties.map((f) => f.faculty)).toContain("Visual Arts");
    for (const faculty of faculties) {
      expect(faculty.count).toBeGreaterThan(0);
    }
  });

  it("returns an empty list for an institution with no matched SAQA qualifications", () => {
    const tvet = requireInstitutionByType("TVET College");
    expect(getFacultiesForInstitution(tvet)).toEqual([]);
  });

  it("returns an empty list when no institution is given", () => {
    expect(getFacultiesForInstitution(null)).toEqual([]);
  });
});

describe("getQualificationsForInstitutionFaculty", () => {
  it("filters to only the given faculty", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const visualArts = getQualificationsForInstitutionFaculty(stellenbosch, "Visual Arts");

    expect(visualArts.length).toBeGreaterThan(0);
    for (const qualification of visualArts) {
      expect(qualification.subfield).toBe("Visual Arts");
    }
  });

  it("returns every matched qualification when no faculty is given", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const all = getQualificationsForInstitutionFaculty(stellenbosch);
    const visualArts = getQualificationsForInstitutionFaculty(stellenbosch, "Visual Arts");

    expect(all.length).toBeGreaterThanOrEqual(visualArts.length);
  });

  it("returns an empty list when no institution is given", () => {
    expect(getQualificationsForInstitutionFaculty(null)).toEqual([]);
  });
});

describe("getFacultyQualificationGroups", () => {
  it("attaches each faculty's own qualifications alongside its count, matching getFacultiesForInstitution's ordering", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const groups = getFacultyQualificationGroups(stellenbosch);
    const faculties = getFacultiesForInstitution(stellenbosch);

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
    expect(getFacultyQualificationGroups(tvet)).toEqual([]);
  });
});

describe("searchQualificationsGlobal", () => {
  it("finds a qualification by keyword and returns its owning institution", () => {
    const hits = searchQualificationsGlobal(ALL_INSTITUTIONS, "theatre");

    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.qualification.title.toLowerCase()).toContain("theatre");
      expect(hit.institution.id).toBeTruthy();
    }
  });

  it("returns no more than the requested limit", () => {
    const hits = searchQualificationsGlobal(ALL_INSTITUTIONS, "certificate", 5);
    expect(hits.length).toBeLessThanOrEqual(5);
  });

  it("returns an empty array for an empty query", () => {
    expect(searchQualificationsGlobal(ALL_INSTITUTIONS, "")).toEqual([]);
  });

  it("only searches the institutions it's given, not the full bundled array", () => {
    const stellenbosch = requireInstitutionByName("Stellenbosch University");
    const hits = searchQualificationsGlobal([stellenbosch], "theatre");
    expect(hits.every((hit) => hit.institution.id === stellenbosch.id)).toBe(true);
  });
});
