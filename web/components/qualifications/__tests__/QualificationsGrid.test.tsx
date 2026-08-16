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
  it("renders a card per qualification with a SAQA ID pill, title, NQF level, and credits", () => {
    render(<QualificationsGrid qualifications={[makeQualification()]} />);

    expect(screen.getByText("Advanced Certificate in Business Management and Administration")).toBeInTheDocument();
    expect(screen.getByText("SAQA ID 101772")).toBeInTheDocument();
    expect(screen.getByText(/NQF Level 6/i)).toBeInTheDocument();
    expect(screen.getByText("Min. Credits: 120")).toBeInTheDocument();
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

  it("explains the min-credits pill via a hover tooltip", () => {
    render(<QualificationsGrid qualifications={[makeQualification({ credits: 120 })]} />);

    expect(screen.getByText("You need a minimum of 120 credits to apply")).toBeInTheDocument();
  });

  it("shows a helpful empty state when there are no qualifications to display", () => {
    render(<QualificationsGrid qualifications={[]} />);

    expect(screen.getByText(/no qualifications/i)).toBeInTheDocument();
  });

  it("names the search term and faculty in the empty state when both are given", () => {
    render(<QualificationsGrid qualifications={[]} searchTerm="Computer" facultyName="Cultural Studies" />);

    expect(screen.getByText('No qualifications found for "Computer" in Cultural Studies faculty')).toBeInTheDocument();
  });

  it("names the search term without a faculty clause when no faculty name is given", () => {
    render(<QualificationsGrid qualifications={[]} searchTerm="Computer" />);

    expect(screen.getByText('No qualifications found for "Computer"')).toBeInTheDocument();
    expect(screen.queryByText(/in .* faculty/i)).not.toBeInTheDocument();
  });

  it("renders no decorative icons on the SAQA ID or NQF pills", () => {
    const { container } = render(<QualificationsGrid qualifications={[makeQualification({ credits: undefined })]} />);

    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });
});
