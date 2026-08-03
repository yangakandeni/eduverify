import { describe, expect, it } from "vitest";
import { searchLocal } from "./search";
import { getDisplayName } from "./presentation";

describe("searchLocal abbreviation matching", () => {
  it("finds a public university by its common abbreviation", () => {
    const results = searchLocal("UCT");
    expect(results.some((r) => r.name === "University of Cape Town")).toBe(true);
  });

  it("matches abbreviations case-insensitively", () => {
    const results = searchLocal("cput");
    expect(results.some((r) => r.name === "Cape Peninsula University of Technology")).toBe(true);
  });

  it("ranks an exact abbreviation match above unrelated substring matches", () => {
    const results = searchLocal("Wits");
    expect(results[0]?.name).toBe("University of the Witwatersrand");
  });

  it("never surfaces the abbreviation itself as the institution's display name", () => {
    const results = searchLocal("UJ");
    const uj = results.find((r) => r.name === "University of Johannesburg");
    expect(uj).toBeDefined();
    expect(getDisplayName(uj!.name, uj!.tradingName)).toBe("University of Johannesburg");
  });
});
