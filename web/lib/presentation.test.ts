import { describe, expect, it } from "vitest";
import { getDisplayName, getRegistrationDetails, getVerificationDescription } from "./presentation";
import type { InstitutionRecord } from "./types";

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "id",
    name: "Test Institution",
    address: "",
    contacts: { email: [], phone: [] },
    qualifications: [],
    institutionType: "Private Higher Education Institution",
    ...overrides,
  };
}

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

  it("strips a trailing (The) bracket left after other corporate suffixes are removed", () => {
    expect(getDisplayName("South African College of Applied Psychology (Pty) Ltd (The)")).toBe(
      "South African College of Applied Psychology"
    );
    expect(getDisplayName("Private Hotel School (Pty) Ltd (The)")).toBe("Private Hotel School");
    expect(getDisplayName("Bible Institute of South Africa NPC (The)")).toBe(
      "Bible Institute of South Africa"
    );
  });

  it("strips a trailing (Die) bracket, the Afrikaans equivalent of (The)", () => {
    expect(getDisplayName("Afrikaanse Protestantse Akademie (Die) NPC")).toBe(
      "Afrikaanse Protestantse Akademie"
    );
  });

  it("strips an inline '/ABBREV' trading-name marker embedded in the legal name", () => {
    expect(
      getDisplayName("South African School of Motion Picture Medium & Live Performance (Pty) Ltd /AFDA (The)")
    ).toBe("South African School of Motion Picture Medium & Live Performance");
  });

  it("cuts a bare (unparenthesized) trailing 'Previously ...' clause, alongside a slash trading marker", () => {
    expect(
      getDisplayName(
        "The Graduate Institute of Financial Sciences Private Higher Education Pty Ltd /GIFSPHEI Previously Katapult Business School (Pty) Ltd"
      )
    ).toBe("The Graduate Institute of Financial Sciences Private Higher Education");
  });

  it("cuts a 'Previous name:' clause even when a stray colon precedes it", () => {
    expect(getDisplayName("IQ Academy (Pty) Ltd: Previous name: Fernwood Business College (Pty) Ltd")).toBe(
      "IQ Academy"
    );
  });

  it("strips a bare trailing 'Pty' left dangling by a malformed 'Pty (Ltd)' ordering", () => {
    expect(getDisplayName("Camelot International Pty (Ltd)")).toBe("Camelot International");
  });

  it("never reduces a full institution name to a bare short-form acronym", () => {
    expect(getDisplayName("University of Pretoria")).not.toBe("UP");
    expect(getDisplayName("Tshwane University of Technology")).not.toBe("TUT");
    expect(getDisplayName("University of the Witwatersrand")).not.toBe("Wits");
    expect(getDisplayName("University of South Africa")).not.toBe("UNISA");
  });
});

describe("getRegistrationDetails", () => {
  it("uses the registration number when present", () => {
    const institution = makeInstitution({ registration_number: "2007/HE07/003" });
    expect(getRegistrationDetails(institution)).toEqual({
      label: "Registration No.",
      value: "2007/HE07/003",
    });
  });

  it("falls back to the institution type when there is no registration number, so the grid column never collapses", () => {
    const institution = makeInstitution({ registration_number: null, institutionType: "Public University" });
    expect(getRegistrationDetails(institution)).toEqual({
      label: "Institution Type",
      value: "Public University",
    });
  });

  it("falls back to the institution type for a TVET college with no registration number", () => {
    const institution = makeInstitution({ registration_number: undefined, institutionType: "TVET College" });
    expect(getRegistrationDetails(institution)).toEqual({
      label: "Institution Type",
      value: "TVET College",
    });
  });
});

describe("getVerificationDescription", () => {
  it("describes a registered institution as officially registered with DHET", () => {
    const institution = makeInstitution({ status: "Registered" });
    expect(getVerificationDescription(institution)).toBe(
      "This institution is officially registered with the Department of Higher Education and Training."
    );
  });

  it("describes a provisionally registered institution as pending full accreditation", () => {
    const institution = makeInstitution({ status: "Provisionally Registered" });
    expect(getVerificationDescription(institution)).toBe(
      "This institution is provisionally registered with the Department of Higher Education and Training, pending full accreditation."
    );
  });
});
