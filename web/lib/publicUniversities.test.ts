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
});
