import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import raw from "../../data/institutions.json";
import { ALL_INSTITUTIONS } from "./localData";

describe("localData institutions.json source", () => {
  it("does not keep a duplicate copy under web/data that could drift from the canonical file", () => {
    const duplicatePath = path.resolve(import.meta.dirname, "../data/institutions.json");

    expect(existsSync(duplicatePath)).toBe(false);
  });

  it("reflects the canonical repo-root data/institutions.json, including status updates", () => {
    const cancelledCamelot = (raw as Array<{ name: string; status: string }>).find(
      (institution) =>
        institution.name === "Camelot International Pty (Ltd)",
    );

    expect(cancelledCamelot?.status).toBe("Cancelled");
    expect(
      ALL_INSTITUTIONS.some(
        (institution) =>
          institution.name === "Camelot International Pty (Ltd)" &&
          institution.status === "Cancelled",
      ),
    ).toBe(true);
  });
});
