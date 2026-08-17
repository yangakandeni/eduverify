import { describe, expect, it } from "vitest";
import {
  getFacultiesForInstitution,
  getFacultyQualificationGroups,
  getQualificationsForInstitutionFaculty,
  resolveInitialFaculty,
  searchQualificationsGlobal,
  ALL_QUALIFICATIONS_FACULTY,
} from "./qualificationsData";
import type { InstitutionRecord, SaqaQualification } from "./types";

function makeQualification(overrides: Partial<SaqaQualification> = {}): SaqaQualification {
  return {
    qualId: 1,
    title: "Diploma in Something",
    nqfLevelRaw: "NQF Level 06",
    subfield: "Law",
    originator: "Fixture Institution",
    ...overrides,
  };
}

const lawQualification = makeQualification({ qualId: 1, title: "Diploma in Something", subfield: "Law" });
const artsQualification = makeQualification({ qualId: 2, title: "Certificate in Art", subfield: "Arts" });
const hospitalityQualification = makeQualification({
  qualId: 3,
  title: "Diploma in Hospitality Management",
  subfield: "Hospitality",
  originator: "Other Institution",
});

const fixtureInstitution: InstitutionRecord = {
  id: "fixture-institution",
  name: "Fixture Institution",
  address: "",
  contacts: { email: [], phone: [] },
  institutionType: "Private Higher Education Institution",
  faculties_and_programmes: [
    { faculty: "Law", programmes: [lawQualification] },
    { faculty: "Arts", programmes: [artsQualification] },
  ],
};

const otherInstitution: InstitutionRecord = {
  id: "other-institution",
  name: "Other Institution",
  address: "",
  contacts: { email: [], phone: [] },
  institutionType: "Private Higher Education Institution",
  faculties_and_programmes: [{ faculty: "Hospitality", programmes: [hospitalityQualification] }],
};

describe("qualificationsData (unit, plain fixtures)", () => {
  it("getFacultiesForInstitution reads faculties directly off the institution's own faculties_and_programmes", () => {
    expect(getFacultiesForInstitution(fixtureInstitution)).toEqual([
      { faculty: "Arts", count: 1 },
      { faculty: "Law", count: 1 },
    ]);
  });

  it("getQualificationsForInstitutionFaculty filters to the requested faculty without re-matching", () => {
    expect(getQualificationsForInstitutionFaculty(fixtureInstitution, "Law")).toEqual([lawQualification]);
    expect(getQualificationsForInstitutionFaculty(fixtureInstitution)).toEqual([lawQualification, artsQualification]);
  });

  it("searchQualificationsGlobal searches every given institution's faculties_and_programmes directly", () => {
    const hits = searchQualificationsGlobal([fixtureInstitution, otherInstitution], "art");

    expect(hits).toHaveLength(1);
    expect(hits[0].qualification).toEqual(artsQualification);
    expect(hits[0].institution.id).toBe(fixtureInstitution.id);
  });

  it("does not surface a qualification whose title merely contains the query as a bare mid-word substring", () => {
    const hits = searchQualificationsGlobal([fixtureInstitution, otherInstitution], "IT");

    expect(hits.some((hit) => hit.qualification.qualId === hospitalityQualification.qualId)).toBe(false);
  });

  it("getFacultyQualificationGroups attaches each faculty's own qualifications to its count", () => {
    expect(getFacultyQualificationGroups(fixtureInstitution)).toEqual([
      { faculty: "Arts", count: 1, qualifications: [artsQualification] },
      { faculty: "Law", count: 1, qualifications: [lawQualification] },
    ]);
  });
});

describe("resolveInitialFaculty", () => {
  const groups = [
    { faculty: "Arts", count: 1, qualifications: [artsQualification] },
    { faculty: "Law", count: 1, qualifications: [lawQualification] },
  ];

  it("returns the requested faculty when it matches an existing group", () => {
    expect(resolveInitialFaculty(groups, "Law")).toBe("Law");
  });

  it("falls back to 'All Qualifications' when none is requested", () => {
    expect(resolveInitialFaculty(groups, undefined)).toBe(ALL_QUALIFICATIONS_FACULTY);
  });

  it("falls back to 'All Qualifications' when the requested one doesn't match any group", () => {
    expect(resolveInitialFaculty(groups, "Medicine")).toBe(ALL_QUALIFICATIONS_FACULTY);
  });

  it("returns undefined when there are no groups at all", () => {
    expect(resolveInitialFaculty([], "Arts")).toBeUndefined();
  });
});
