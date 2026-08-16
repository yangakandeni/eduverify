import { describe, expect, it } from "vitest";
import { institutionCategoryLabels, POPULAR_CATEGORIES, QUALIFICATION_CATEGORIES } from "./categories";
import type { InstitutionRecord } from "./types";

function makeInstitution(qualificationTitles: string[]): InstitutionRecord {
  return {
    id: "id",
    name: "Test Institution",
    address: "",
    contacts: { email: [], phone: [] },
    faculties_and_programmes: [
      {
        faculty: "General",
        programmes: qualificationTitles.map((title, index) => ({
          qualId: index,
          title,
          nqfLevelRaw: "",
          subfield: "General",
          originator: "",
        })),
      },
    ],
    institutionType: "Private Higher Education Institution",
  };
}

describe("POPULAR_CATEGORIES", () => {
  it("leads with the 'all' pill", () => {
    expect(POPULAR_CATEGORIES[0]).toEqual({ key: "all", label: "All" });
  });

  it("caps the pill row at 8 entries", () => {
    expect(POPULAR_CATEGORIES).toHaveLength(8);
  });

  it("resolves every non-'all' key to a real qualification category", () => {
    const validKeys = new Set(QUALIFICATION_CATEGORIES.map((category) => category.key));
    for (const pill of POPULAR_CATEGORIES) {
      if (pill.key === "all") continue;
      expect(validKeys.has(pill.key)).toBe(true);
    }
  });
});

describe("institutionCategoryLabels", () => {
  it("returns matched category labels in PRIMARY_CATEGORY_KEYS order, not qualification order", () => {
    const institution = makeInstitution(["BEng Mechanical Engineering", "BCom Accounting", "Diploma in Computer Science"]);
    expect(institutionCategoryLabels(institution)).toEqual(["Computer Science", "Engineering", "Business"]);
  });

  it("returns an empty list when no qualification matches a primary category", () => {
    const institution = makeInstitution(["Certificate in Basket Weaving"]);
    expect(institutionCategoryLabels(institution)).toEqual([]);
  });

  it("never returns the same category label twice", () => {
    const institution = makeInstitution(["BEng Civil Engineering", "BEng Electrical Engineering"]);
    expect(institutionCategoryLabels(institution)).toEqual(["Engineering"]);
  });
});
