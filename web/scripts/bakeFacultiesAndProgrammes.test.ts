import { describe, expect, it } from "vitest";
import { bakeInstitutions, bakePublicTvets, bakePublicUniversities } from "./bakeFacultiesAndProgrammes";
import type { SaqaQualification } from "../lib/types";

function makeQualification(overrides: Partial<SaqaQualification> = {}): SaqaQualification {
  return {
    qualId: 1,
    title: "Higher Certificate in Digital Marketing",
    nqfLevelRaw: "NQF Level 05",
    nqfLevel: 5,
    subfield: "Marketing",
    originator: "AAA School of Advertising",
    ...overrides,
  };
}

describe("bakeInstitutions", () => {
  it("matches a record against a SAQA row despite a corporate suffix, grouping by subfield", () => {
    const records = [
      {
        name: "AAA School of Advertising (Pty) Ltd",
        registration_number: "2000/HE07/015",
        status: "Registered",
        address: "1 Long Street",
        province: "Western Cape",
        contacts: { email: [], phone: [] },
        qualifications: ["stale free-text string"],
        cancellation_reason: null,
      },
    ];
    const rows = [makeQualification()];

    const result = bakeInstitutions(records, rows);

    expect(result).toHaveLength(1);
    expect(result[0].faculties_and_programmes).toEqual([{ faculty: "Marketing", programmes: rows }]);
    expect(result[0]).not.toHaveProperty("qualifications");
  });

  it("gives an unmatched record an empty faculties_and_programmes array, not omitted or null", () => {
    const records = [
      {
        name: "Some Unrelated College (Pty) Ltd",
        registration_number: "2005/HE07/999",
        status: "Registered",
        address: "",
        province: null,
        contacts: { email: [], phone: [] },
        qualifications: [],
        cancellation_reason: null,
      },
    ];

    const result = bakeInstitutions(records, [makeQualification()]);

    expect(result[0].faculties_and_programmes).toEqual([]);
  });

  it("gives duplicate rows (same name and registration number) identical matched programmes", () => {
    const duplicateRow = {
      name: "AAA School of Advertising (Pty) Ltd",
      registration_number: "2000/HE07/015",
      status: "Registered",
      address: "1 Long Street",
      province: "Western Cape",
      contacts: { email: [], phone: [] },
      qualifications: ["stale free-text string"],
      cancellation_reason: null,
    };

    const result = bakeInstitutions([duplicateRow, { ...duplicateRow }], [makeQualification()]);

    expect(result[0].faculties_and_programmes).toEqual(result[1].faculties_and_programmes);
    expect(result[0].faculties_and_programmes).toEqual([{ faculty: "Marketing", programmes: [makeQualification()] }]);
  });
});

describe("bakePublicUniversities", () => {
  it("replaces degrees with matched faculties_and_programmes", () => {
    const records = [
      {
        name: "AAA School of Advertising",
        abbreviation: "AAA",
        address: "1 Long Street",
        province: "Western Cape",
        website: "www.aaaschool.co.za",
        degrees: [{ title: "stale hand-picked degree", nqfLevel: 5 }],
      },
    ];

    const result = bakePublicUniversities(records, [makeQualification()]);

    expect(result[0].faculties_and_programmes).toEqual([{ faculty: "Marketing", programmes: [makeQualification()] }]);
    expect(result[0]).not.toHaveProperty("degrees");
  });
});

describe("bakePublicTvets", () => {
  it("gives a TVET (no possible SAQA match) an empty faculties_and_programmes array with the old field gone", () => {
    const records = [
      {
        name: "Some TVET College",
        abbreviation: "STC",
        address: "1 Main Road",
        province: "Gauteng",
        website: "www.sometvet.ac.za",
        qualifications: [{ title: "stale hand-picked qualification", nqfLevel: 5 }],
      },
    ];

    const result = bakePublicTvets(records, [makeQualification()]);

    expect(result[0].faculties_and_programmes).toEqual([]);
    expect(result[0]).not.toHaveProperty("qualifications");
  });
});
