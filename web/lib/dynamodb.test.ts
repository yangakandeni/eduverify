import { describe, expect, it } from "vitest";
import { toRecord } from "./dynamodb";

describe("toRecord", () => {
  it("passes faculties_and_programmes through when present on the item", () => {
    const item = {
      PK: "INST#2000/HE07/015",
      GSI1PK: "REGISTERED",
      GSI1SK: "AAA School of Advertising",
      name: "AAA School of Advertising",
      faculties_and_programmes: [{ faculty: "Marketing", programmes: [] }],
    };

    const result = toRecord(item);

    expect(result.faculties_and_programmes).toEqual([{ faculty: "Marketing", programmes: [] }]);
    expect(result.id).toBe("INST#2000/HE07/015");
  });

  it("defaults faculties_and_programmes to [] for a legacy item ingested without it", () => {
    const item = {
      PK: "INST#2000/HE07/015",
      GSI1PK: "REGISTERED",
      GSI1SK: "AAA School of Advertising",
      name: "AAA School of Advertising",
    };

    const result = toRecord(item);

    expect(result.faculties_and_programmes).toEqual([]);
  });

  it("strips a stale raw qualifications key if still present on a legacy item", () => {
    const item = {
      PK: "INST#2000/HE07/015",
      GSI1PK: "REGISTERED",
      GSI1SK: "AAA School of Advertising",
      name: "AAA School of Advertising",
      qualifications: ["1) Some stale scraped string"],
    };

    const result = toRecord(item);

    expect(result).not.toHaveProperty("qualifications");
  });
});
