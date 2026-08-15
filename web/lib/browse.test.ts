import { describe, expect, it } from "vitest";
import {
  ALL_PROVINCES_VALUE,
  ALL_STATUSES_VALUE,
  ALL_TYPES_VALUE,
  filterInstitutionsForBrowse,
  getBrowseTitle,
  getEmptyStateDetail,
  getEmptyStateHeading,
  getResultCountLabel,
} from "./browse";
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
    expect(
      filterInstitutionsForBrowse(institutions, {
        province: ALL_PROVINCES_VALUE,
        institutionType: ALL_TYPES_VALUE,
        status: ALL_STATUSES_VALUE,
      })
    ).toEqual(institutions);
  });

  it("filters by province only", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: "Gauteng",
      institutionType: ALL_TYPES_VALUE,
      status: ALL_STATUSES_VALUE,
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "3"]);
  });

  it("filters by institution type only", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: "Public University",
      status: ALL_STATUSES_VALUE,
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "2"]);
  });

  it("filters by both province and institution type combined", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: "Gauteng",
      institutionType: "Public University",
      status: ALL_STATUSES_VALUE,
    });
    expect(result.map((institution) => institution.id)).toEqual(["1"]);
  });

  it("returns an empty list when no institution matches the combination", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: "Limpopo",
      institutionType: "Public University",
      status: ALL_STATUSES_VALUE,
    });
    expect(result).toEqual([]);
  });
});

describe("filterInstitutionsForBrowse status filter", () => {
  const institutions = [
    makeInstitution({ id: "1", status: "Registered" }),
    makeInstitution({ id: "2", status: "Provisionally Registered" }),
    makeInstitution({ id: "3", status: null }),
  ];

  it("returns everything when status is 'All'", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: ALL_STATUSES_VALUE,
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "2", "3"]);
  });

  it("filters to registered institutions, treating a missing status as registered", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: "registered",
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "3"]);
  });

  it("filters to provisionally registered institutions", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: "provisional",
    });
    expect(result.map((institution) => institution.id)).toEqual(["2"]);
  });
});

describe("filterInstitutionsForBrowse status filter with a cancelled institution", () => {
  const institutions = [
    makeInstitution({ id: "1", status: "Registered" }),
    makeInstitution({ id: "2", status: "Provisionally Registered" }),
    makeInstitution({ id: "3", status: "Cancelled" }),
  ];

  it("still shows the cancelled institution when no status filter is applied", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: ALL_STATUSES_VALUE,
    });
    expect(result.map((institution) => institution.id)).toEqual(["1", "2", "3"]);
  });

  it("excludes the cancelled institution from the 'Provisionally Registered' filter", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: "provisional",
    });
    expect(result.map((institution) => institution.id)).toEqual(["2"]);
  });

  it("excludes the cancelled institution from the 'Registered' filter", () => {
    const result = filterInstitutionsForBrowse(institutions, {
      province: ALL_PROVINCES_VALUE,
      institutionType: ALL_TYPES_VALUE,
      status: "registered",
    });
    expect(result.map((institution) => institution.id)).toEqual(["1"]);
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

describe("getBrowseTitle", () => {
  it("defaults to the browse-all heading when there is no active query", () => {
    expect(getBrowseTitle()).toBe("Browse All Institutions");
    expect(getBrowseTitle("")).toBe("Browse All Institutions");
  });

  it("shows a query-specific heading when a search is active", () => {
    expect(getBrowseTitle("university")).toBe('Results for "university"');
  });
});

describe("getEmptyStateHeading", () => {
  it("always reads 'No institutions found'", () => {
    expect(getEmptyStateHeading()).toBe("No institutions found");
  });
});

describe("getEmptyStateDetail", () => {
  it("defaults to the generic filter message when there is no active query", () => {
    expect(getEmptyStateDetail()).toBe("No institutions match these filters yet.");
    expect(getEmptyStateDetail("")).toBe("No institutions match these filters yet.");
  });

  it("shows a query-specific message when a search is active", () => {
    expect(getEmptyStateDetail("blah")).toBe('"blah" wasn\'t found in the current dataset.');
  });
});
