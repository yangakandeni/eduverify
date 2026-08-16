import { describe, expect, it } from "vitest";
import { buildCollections, buildRecommended, chunk } from "./collections";
import type { InstitutionRecord } from "./types";

let counter = 0;

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  counter += 1;
  return {
    id: `inst-${counter}`,
    name: `Institution ${counter}`,
    address: "1 Main Road",
    province: "Gauteng",
    contacts: { email: [], phone: [] },
    faculties_and_programmes: [],
    institutionType: "Private Higher Education Institution",
    ...overrides,
  };
}

describe("buildCollections", () => {
  it("always includes Recommended, even when nothing else qualifies", () => {
    const institutions = [makeInstitution(), makeInstitution()];
    const collections = buildCollections(institutions, "Gauteng");
    expect(collections.map((c) => c.key)).toEqual(["recommended"]);
  });

  it("hides Featured when no institution is sponsored or featured", () => {
    const institutions = [makeInstitution(), makeInstitution()];
    const collections = buildCollections(institutions, "Gauteng");
    expect(collections.some((c) => c.key === "featured")).toBe(false);
  });

  it("shows Featured once an institution is sponsored", () => {
    const institutions = [makeInstitution(), makeInstitution({ isSponsored: true })];
    const collections = buildCollections(institutions, "Gauteng");
    expect(collections.some((c) => c.key === "featured")).toBe(true);
  });

  it("hides Recently Added when no institution is flagged", () => {
    const institutions = [makeInstitution(), makeInstitution()];
    const collections = buildCollections(institutions, "Gauteng");
    expect(collections.some((c) => c.key === "recently-added")).toBe(false);
  });

  it("shows Recently Added once an institution is flagged", () => {
    const institutions = [makeInstitution(), makeInstitution({ isRecentlyAdded: true })];
    const collections = buildCollections(institutions, "Gauteng");
    expect(collections.some((c) => c.key === "recently-added")).toBe(true);
  });
});

describe("buildRecommended", () => {
  it("filters to the given province", () => {
    const local = makeInstitution({ province: "Western Cape" });
    const elsewhere = makeInstitution({ province: "Gauteng" });
    const result = buildRecommended([local, elsewhere], "Western Cape");
    expect(result).toEqual([local]);
  });

  it("ranks local sponsored partners above public institutions, and public above private", () => {
    const sponsored = makeInstitution({ province: "Western Cape", isSponsored: true, institutionType: "Private Higher Education Institution" });
    const publicUni = makeInstitution({ province: "Western Cape", institutionType: "Public University" });
    const privateInst = makeInstitution({ province: "Western Cape", institutionType: "Private Higher Education Institution" });
    const result = buildRecommended([privateInst, publicUni, sponsored], "Western Cape");
    expect(result).toEqual([sponsored, publicUni, privateInst]);
  });

  it("falls back to the nationwide pool when the province has no matches", () => {
    const gauteng = makeInstitution({ province: "Gauteng" });
    const result = buildRecommended([gauteng], "Limpopo");
    expect(result).toEqual([gauteng]);
  });
});

describe("chunk", () => {
  it("splits a list into fixed-size groups, with a smaller final group", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(chunk(items, 5)).toEqual([[1, 2, 3, 4, 5], [6, 7]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 5)).toEqual([]);
  });
});
