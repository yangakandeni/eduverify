import { describe, expect, it } from "vitest";
import { sortSavedInstitutionsByRecency, withSavedInstitution, withoutSavedInstitution } from "./dashboardData";
import type { SavedInstitution } from "./dashboardData";

describe("withSavedInstitution", () => {
  it("appends a new entry", () => {
    const result = withSavedInstitution([], "INST#1", "2026-01-01T00:00:00.000Z");
    expect(result).toEqual([{ institutionId: "INST#1", savedAt: "2026-01-01T00:00:00.000Z" }]);
  });

  it("is a no-op when the institution is already saved", () => {
    const existing: SavedInstitution[] = [{ institutionId: "INST#1", savedAt: "2026-01-01T00:00:00.000Z" }];
    const result = withSavedInstitution(existing, "INST#1", "2026-02-01T00:00:00.000Z");
    expect(result).toBe(existing);
  });
});

describe("withoutSavedInstitution", () => {
  it("removes the matching entry", () => {
    const existing: SavedInstitution[] = [
      { institutionId: "INST#1", savedAt: "2026-01-01T00:00:00.000Z" },
      { institutionId: "INST#2", savedAt: "2026-01-02T00:00:00.000Z" },
    ];
    expect(withoutSavedInstitution(existing, "INST#1")).toEqual([
      { institutionId: "INST#2", savedAt: "2026-01-02T00:00:00.000Z" },
    ]);
  });

  it("is a no-op when the institution isn't saved", () => {
    const existing: SavedInstitution[] = [{ institutionId: "INST#1", savedAt: "2026-01-01T00:00:00.000Z" }];
    expect(withoutSavedInstitution(existing, "INST#404")).toEqual(existing);
  });
});

describe("sortSavedInstitutionsByRecency", () => {
  it("orders most-recently-saved first", () => {
    const saved: SavedInstitution[] = [
      { institutionId: "INST#1", savedAt: "2026-01-01T00:00:00.000Z" },
      { institutionId: "INST#2", savedAt: "2026-03-01T00:00:00.000Z" },
      { institutionId: "INST#3", savedAt: "2026-02-01T00:00:00.000Z" },
    ];
    expect(sortSavedInstitutionsByRecency(saved).map((entry) => entry.institutionId)).toEqual([
      "INST#2",
      "INST#3",
      "INST#1",
    ]);
  });
});
