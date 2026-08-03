import { describe, expect, it } from "vitest";
import { ALL_PROVINCES_VALUE, ALL_TYPES_VALUE, filterInstitutionsForBrowse, getResultCountLabel } from "./browse";
import type { InstitutionRecord } from "./types";

function makeInstitution(overrides: Partial<InstitutionRecord>): InstitutionRecord {
  return {
    id: "id",
    name: "Test Institution",
    address: "",
    contacts: { email: [], phone: [] },
    qualifications: [],
    institutionType: "Private Higher Education Institution",
    province: "Gauteng",
    ...overrides,
  };
}

describe("filterInstitutionsForBrowse", () => {
  const institutions = [
    makeInstitution({ id: "1", province: "Gauteng", institutionType: "Public University" }),
    makeInstitution({ id: "2", province: "Western Cape", institutionType: "Public University" }),
    makeInstitution({ id: "3", province: "Gauteng", institutionType: "Private Higher Education Institution" }),
  ];

  it("returns every institution when both filters are set to 'All'", () => {
    expect(filterInstitutionsForBrowse(institutions, { province: ALL_PROVINCES_VALUE, institutionType: ALL_TYPES_VALUE })).toEqual(
      institutions
    );
  });

  it("filters by province only", () => {
    const result = filterInstitutionsForBrowse(institutions, { province: "Gauteng", institutionType: ALL_TYPES_VALUE });
    expect(result.map((institution) => institution.id)).toEqual(["1", "3"]);
  });

  it("filters by institution type only", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: "Public University",
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "2"]);
  });

  it("filters by both province and institution type combined", () => {
    const result = filterInstitutionsForBrowse(institutions, { province: "Gauteng", institutionType: "Public University" });
    expect(result.map((institution) => institution.id)).toEqual(["1"]);
  });

  it("returns an empty list when no institution matches the combination", () => {
    const result = filterInstitutionsForBrowse(institutions, { province: "Limpopo", institutionType: "Public University" });
    expect(result).toEqual([]);
  });
});

describe("getResultCountLabel", () => {
  it("pluralizes for zero and multiple results", () => {
    expect(getResultCountLabel(0)).toBe("0 institutions found");
    expect(getResultCountLabel(18)).toBe("18 institutions found");
  });

  it("keeps the singular form for exactly one result", () => {
    expect(getResultCountLabel(1)).toBe("1 institution found");
  });
});
