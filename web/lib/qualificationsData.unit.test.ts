import { describe, expect, it, vi } from "vitest";
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

vi.mock("./localData", () => ({
  ALL_INSTITUTIONS: [fixtureInstitution],
  findLocalById: (id: string) => (id === fixtureInstitution.id ? fixtureInstitution : undefined),
}));

describe("qualificationsData (unit, mocked localData)", () => {
  it("getFacultiesForInstitution reads faculties directly off the institution's own faculties_and_programmes", async () => {
    const { getFacultiesForInstitution } = await import("./qualificationsData");

    expect(getFacultiesForInstitution(fixtureInstitution.id)).toEqual([
      { faculty: "Arts", count: 1 },
      { faculty: "Law", count: 1 },
    ]);
  });

  it("getQualificationsForInstitutionFaculty filters to the requested faculty without re-matching", async () => {
    const { getQualificationsForInstitutionFaculty } = await import("./qualificationsData");

    expect(getQualificationsForInstitutionFaculty(fixtureInstitution.id, "Law")).toEqual([lawQualification]);
    expect(getQualificationsForInstitutionFaculty(fixtureInstitution.id)).toEqual([
      lawQualification,
      artsQualification,
    ]);
  });

  it("searchQualificationsGlobal searches every institution's faculties_and_programmes directly", async () => {
    const { searchQualificationsGlobal } = await import("./qualificationsData");

    const hits = searchQualificationsGlobal("art");

    expect(hits).toHaveLength(1);
    expect(hits[0].qualification).toEqual(artsQualification);
    expect(hits[0].institution.id).toBe(fixtureInstitution.id);
  });

  it("getFacultyQualificationGroups attaches each faculty's own qualifications to its count", async () => {
    const { getFacultyQualificationGroups } = await import("./qualificationsData");

    expect(getFacultyQualificationGroups(fixtureInstitution.id)).toEqual([
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

  it("returns the requested faculty when it matches an existing group", async () => {
    const { resolveInitialFaculty } = await import("./qualificationsData");
    expect(resolveInitialFaculty(groups, "Law")).toBe("Law");
  });

  it("falls back to 'All Qualifications' when none is requested", async () => {
    const { resolveInitialFaculty, ALL_QUALIFICATIONS_FACULTY } = await import("./qualificationsData");
    expect(resolveInitialFaculty(groups, undefined)).toBe(ALL_QUALIFICATIONS_FACULTY);
  });

  it("falls back to 'All Qualifications' when the requested one doesn't match any group", async () => {
    const { resolveInitialFaculty, ALL_QUALIFICATIONS_FACULTY } = await import("./qualificationsData");
    expect(resolveInitialFaculty(groups, "Medicine")).toBe(ALL_QUALIFICATIONS_FACULTY);
  });

  it("returns undefined when there are no groups at all", async () => {
    const { resolveInitialFaculty } = await import("./qualificationsData");
    expect(resolveInitialFaculty([], "Arts")).toBeUndefined();
  });
});
