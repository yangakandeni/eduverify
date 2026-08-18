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

describe("buildCollections against an eduverify-api-shaped response", () => {
  it("degrades gracefully to Recommended-only, ranked public/TVET before private, when nothing is curated", () => {
    // Mirrors what getAllInstitutions() returns via USE_EXTERNAL_API=true today: every
    // record's isSponsored/isFeatured/isRecentlyAdded is undefined (eduverify-api declares
    // the fields but nothing populates them yet) — same as the legacy local path, since no
    // curation data exists anywhere. This locks in that the API path doesn't regress hero
    // rendering just because those flags are always absent.
    const institutions = [
      makeInstitution({ institutionType: "Private Higher Education Institution", province: "Gauteng" }),
      makeInstitution({ institutionType: "Public University", province: "Gauteng" }),
      makeInstitution({ institutionType: "TVET College", province: "Gauteng" }),
      makeInstitution({ institutionType: "Private Higher Education Institution", province: "Gauteng" }),
    ];

    const collections = buildCollections(institutions, "Gauteng");

    expect(collections.map((c) => c.key)).toEqual(["recommended"]);
    const [recommended] = collections;
    const types = recommended.institutions.map((i) => i.institutionType);
    // Public University and TVET College share tierRank 1, so their relative order is an
    // untested tiebreak (qualification count, then name) — assert the tier grouping, not a
    // specific order within it.
    expect(types.slice(0, 2).sort()).toEqual(["Public University", "TVET College"]);
    expect(types.slice(2)).toEqual([
      "Private Higher Education Institution",
      "Private Higher Education Institution",
    ]);
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
