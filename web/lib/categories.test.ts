import { describe, expect, it } from "vitest";
import { POPULAR_CATEGORIES, QUALIFICATION_CATEGORIES } from "./categories";

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
