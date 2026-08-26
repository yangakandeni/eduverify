import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import raw from "../../data/institutions.json";
import { institutionKey } from "./keys";
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

  it("keeps the last (most terminal) duplicate row for an id, not the first", () => {
    const reebokRows = (raw as Array<{ name: string; status: string; registration_number: string | null }>).filter(
      (institution) => institution.name === "Reebok Education (Pty) Ltd",
    );

    // The DHET register lists this institution under both an earlier, less-terminal
    // section (status "Cancelled") and a later section (status "Discontinued") for the
    // same id — deduping must keep the later/most-terminal row, not whichever came first.
    expect(reebokRows.map((r) => r.status)).toEqual(["Cancelled", "Discontinued"]);

    const id = institutionKey(reebokRows[0]);
    const deduped = ALL_INSTITUTIONS.find((institution) => institution.id === id);

    expect(deduped?.status).toBe("Discontinued");
  });
});
