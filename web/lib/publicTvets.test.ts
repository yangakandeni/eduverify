import { describe, expect, it } from "vitest";
import { loadPublicTvets } from "./publicTvets";
import { getDisplayName } from "./presentation";

describe("loadPublicTvets", () => {
  it("loads all 50 public TVET colleges", () => {
    const institutions = loadPublicTvets();
    expect(institutions).toHaveLength(50);
  });

  it("does not set an abbreviation as the trading name, so full names render as-is", () => {
    const institutions = loadPublicTvets();
    const cjc = institutions.find((i) => i.name === "Central Johannesburg TVET College");
    expect(cjc).toBeDefined();
    expect(getDisplayName(cjc.name, cjc.tradingName)).toBe("Central Johannesburg TVET College");
  });

  it("carries the abbreviation through for search, without it becoming the trading name", () => {
    const institutions = loadPublicTvets();
    const cjc = institutions.find((i) => i.name === "Central Johannesburg TVET College");
    expect(cjc).toBeDefined();
    expect(cjc.abbreviation).toBe("CJC");
    expect(cjc.tradingName).toBeUndefined();
  });

  it("tags every record as a TVET College with a unique id", () => {
    const institutions = loadPublicTvets();
    expect(institutions.every((i) => i.institutionType === "TVET College")).toBe(true);
    const ids = institutions.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
