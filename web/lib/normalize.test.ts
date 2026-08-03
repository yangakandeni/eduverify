import { describe, expect, it } from "vitest";
import { CANONICAL_PROVINCES, parseInstitutionAddresses } from "./normalize";

describe("parseInstitutionAddresses", () => {
  it("splits a multi-location address into distinct locations with prefixes stripped", () => {
    const raw =
      "A) Bryanston: The Braes Office Park, 3 Eaton Avenue, Bryanston, 2191 B) Cape Town: 6thFloor, AAA House, 112 Long Street, Cape Town, 8001.";

    const locations = parseInstitutionAddresses(raw, CANONICAL_PROVINCES);

    expect(locations).toHaveLength(2);
    for (const location of locations) {
      expect(location.address).not.toMatch(/[A-Z]\)/);
      expect(location.address).not.toMatch(/^\s*[A-Za-z\s]+:/);
    }
    expect(locations[0].address).toBe("The Braes Office Park, 3 Eaton Avenue, Bryanston, 2191");
    expect(locations[0].label).toBe("Bryanston");
    expect(locations[1].address).toBe("6thFloor, AAA House, 112 Long Street, Cape Town, 8001.");
    expect(locations[1].label).toBe("Cape Town");
  });

  it("returns a single location for an address with no letter prefixes", () => {
    const raw = "150 Kelvin Drive, Woodmead, Johannesburg, 2197";

    const locations = parseInstitutionAddresses(raw, CANONICAL_PROVINCES);

    expect(locations).toHaveLength(1);
    expect(locations[0].address).toBe(raw);
  });

  it("labels a single, unmarked address with the given fallback label instead of the first canonical province", () => {
    const raw = "150 Kelvin Drive, Woodmead, Johannesburg, 2197";

    const locations = parseInstitutionAddresses(raw, CANONICAL_PROVINCES, "Gauteng");

    expect(locations[0].label).toBe("Gauteng");
  });

  it("uses the canonical province name as the label when the prefix already names a province", () => {
    const raw = "A) Gauteng: 1 Main Road B) Western Cape: 2 Long Street";

    const locations = parseInstitutionAddresses(raw, CANONICAL_PROVINCES);

    expect(locations.map((location) => location.label)).toEqual(["Gauteng", "Western Cape"]);
  });

  it("returns an empty array for an empty address", () => {
    expect(parseInstitutionAddresses("", CANONICAL_PROVINCES)).toEqual([]);
  });

  it("assigns each location a stable, unique id", () => {
    const raw = "A) Bryanston: 1 Main Road B) Cape Town: 2 Long Street";
    const locations = parseInstitutionAddresses(raw, CANONICAL_PROVINCES);
    expect(new Set(locations.map((location) => location.id)).size).toBe(2);
  });
});
