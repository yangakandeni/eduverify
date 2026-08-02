import { describe, expect, it } from "vitest";
import { getDisplayName } from "./presentation";

describe("getDisplayName", () => {
  it("strips (Pty) Ltd and a trailing acronym bracket", () => {
    expect(getDisplayName("Academy for Facility Management (Pty) Ltd (A4FM)")).toBe(
      "Academy for Facility Management"
    );
  });

  it("strips (Pty) Ltd and a trailing 'Previously ...' parenthetical", () => {
    expect(
      getDisplayName("Boston City Campus (Pty) Ltd (Previously Boston City Campus and Business College)")
    ).toBe("Boston City Campus");
  });

  it("strips Limited and a trailing 'Incorporated in ...' parenthetical", () => {
    expect(
      getDisplayName("Monash South Africa Limited (Incorporated in Australia External Profit Company)")
    ).toBe("Monash South Africa");
  });

  it("truncates at a trailing 'Previous Name:' clause", () => {
    expect(
      getDisplayName(
        "Berea College of Technology (Pty) Ltd Previous Name: Durban Computer College (Pty) Ltd t/a DCC Campus"
      )
    ).toBe("Berea College of Technology");
  });

  it("prioritizes a clean trading name over the legal name", () => {
    expect(getDisplayName("Varsity College (Pty) Ltd", "Varsity College")).toBe("Varsity College");
    expect(getDisplayName("Educor (Pty) Ltd t/a Damelin", "Damelin")).toBe("Damelin");
  });

  it("falls back to cleaning the legal name when no trading name is given", () => {
    expect(getDisplayName("University of Cape Town")).toBe("University of Cape Town");
  });

  it("falls back to cleaning the legal name when the trading name is empty or whitespace", () => {
    expect(getDisplayName("Damelin (Pty) Ltd", "")).toBe("Damelin");
    expect(getDisplayName("Damelin (Pty) Ltd", "   ")).toBe("Damelin");
  });

  it("falls back to cleaning the legal name when no trading name is provided at all", () => {
    expect(getDisplayName("Rosebank College (Pty) Ltd")).toBe("Rosebank College");
  });

  it("collapses double spaces left behind after stripping", () => {
    expect(getDisplayName("Some  College   (Pty) Ltd")).toBe("Some College");
  });

  it("never returns an empty string, even when stripping would consume the whole name", () => {
    expect(getDisplayName(" (Pty) Ltd")).toBe("(Pty) Ltd");
  });
});
