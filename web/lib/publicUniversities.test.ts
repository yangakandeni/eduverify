import { describe, expect, it } from "vitest";
import { loadPublicUniversities } from "./publicUniversities";
import { getDisplayName } from "./presentation";

describe("loadPublicUniversities", () => {
  it("does not set an abbreviation as the trading name, so full names render as-is", () => {
    const institutions = loadPublicUniversities();
    const uj = institutions.find((i) => i.name === "University of Johannesburg");
    expect(uj).toBeDefined();
    expect(getDisplayName(uj.name, uj.tradingName)).toBe("University of Johannesburg");
  });

  it("carries the abbreviation through for search, without it becoming the trading name", () => {
    const institutions = loadPublicUniversities();
    const uct = institutions.find((i) => i.name === "University of Cape Town");
    expect(uct).toBeDefined();
    expect(uct.abbreviation).toBe("UCT");
    expect(uct.tradingName).toBeUndefined();
  });

  it("carries faculties_and_programmes through from the raw data", () => {
    const institutions = loadPublicUniversities();
    const uct = institutions.find((i) => i.name === "University of Cape Town");
    expect(uct?.faculties_and_programmes).toBeDefined();
  });
});
