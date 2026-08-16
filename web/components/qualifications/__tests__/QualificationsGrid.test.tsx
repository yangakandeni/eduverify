import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationsGrid from "@/components/qualifications/QualificationsGrid";
import type { SaqaQualification } from "@/lib/types";

function makeQualification(overrides: Partial<SaqaQualification> = {}): SaqaQualification {
  return {
    qualId: 101772,
    title: "Advanced Certificate in Business Management and Administration",
    nqfLevel: 6,
    nqfLevelRaw: "NQF Level 06",
    credits: 120,
    subfield: "Generic Management",
    originator: "Stellenbosch University",
    ...overrides,
  };
}

describe("QualificationsGrid", () => {
  it("renders a card per qualification with id, title, NQF level, and credits", () => {
    render(<QualificationsGrid qualifications={[makeQualification()]} />);

    expect(screen.getByText("Advanced Certificate in Business Management and Administration")).toBeInTheDocument();
    expect(screen.getByText("101772")).toBeInTheDocument();
    expect(screen.getByText(/NQF Level 6/i)).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });

  it("falls back to the raw NQF level text when it couldn't be parsed to a number", () => {
    render(
      <QualificationsGrid
        qualifications={[makeQualification({ nqfLevel: undefined, nqfLevelRaw: "Not Applicable" })]}
      />,
    );

    expect(screen.getByText("Not Applicable")).toBeInTheDocument();
  });

  it("omits the credits line when credits are unknown", () => {
    render(<QualificationsGrid qualifications={[makeQualification({ credits: undefined })]} />);

    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument();
  });

  it("shows a helpful empty state when there are no qualifications to display", () => {
    render(<QualificationsGrid qualifications={[]} />);

    expect(screen.getByText(/no qualifications/i)).toBeInTheDocument();
  });
});
