import { beforeEach, describe, expect, it } from "vitest";
import { clearSearchResultsCache, getCachedSearchResults, setCachedSearchResults } from "@/lib/searchResultsCache";
import type { InstitutionRecord } from "@/lib/types";

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "milpark",
    name: "Milpark Education (Pty) Ltd",
    address: "1 Sturdee Avenue, Rosebank",
    province: "Gauteng",
    institutionType: "Private Higher Education Institution",
    faculties_and_programmes: [],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("searchResultsCache", () => {
  beforeEach(() => {
    clearSearchResultsCache();
  });

  it("returns null for a query that has never been cached", () => {
    expect(getCachedSearchResults("chemical")).toBeNull();
  });

  it("returns previously cached results for the same query", () => {
    const results = [makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" })];

    setCachedSearchResults("chemical", results);

    expect(getCachedSearchResults("chemical")).toEqual(results);
  });

  it("keeps separate cache entries per query", () => {
    setCachedSearchResults("chemical", [makeInstitution({ id: "a", name: "A" })]);
    setCachedSearchResults("sport", [makeInstitution({ id: "b", name: "B" })]);

    expect(getCachedSearchResults("chemical")).toEqual([makeInstitution({ id: "a", name: "A" })]);
    expect(getCachedSearchResults("sport")).toEqual([makeInstitution({ id: "b", name: "B" })]);
  });

  it("clears all cached queries", () => {
    setCachedSearchResults("chemical", [makeInstitution()]);

    clearSearchResultsCache();

    expect(getCachedSearchResults("chemical")).toBeNull();
  });
});
