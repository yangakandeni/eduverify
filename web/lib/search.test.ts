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

describe("searchLocal qualification-title fallback", () => {
  it("surfaces an institution whose matched programme titles contain the query, even with no name match", () => {
    const results = searchLocal("theatre");
    expect(results.some((r) => r.name === "Stellenbosch University")).toBe(true);
  });

  it("does not surface an institution whose name merely contains the query as a bare mid-word substring", () => {
    const results = searchLocal("IT");
    expect(results.some((r) => r.name === "Bible Institute of South Africa NPC (The)")).toBe(false);
  });

  it("surfaces an institution offering an Information Technology qualification via the 'IT' alias", () => {
    const results = searchLocal("IT");
    expect(results.some((r) => r.name === "MANCOSA (Pty) Ltd")).toBe(true);
  });

  it("matches a qualification title regardless of search-term word order", () => {
    const results = searchLocal("science computer");
    expect(results.some((r) => r.name === "Akademia NPC")).toBe(true);
  });

  it("tolerates a minor spelling mistake against a qualification title", () => {
    const results = searchLocal("compter scince");
    expect(results.some((r) => r.name === "Akademia NPC")).toBe(true);
  });
});
