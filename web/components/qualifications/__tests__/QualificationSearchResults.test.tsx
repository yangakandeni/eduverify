import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationSearchResults from "@/components/qualifications/QualificationSearchResults";
import type { QualificationSearchHit } from "@/lib/qualificationsData";
import type { InstitutionRecord } from "@/lib/types";

function makeHit(overrides: Partial<QualificationSearchHit> = {}): QualificationSearchHit {
  const institution: InstitutionRecord = {
    id: "stellenbosch",
    name: "Stellenbosch University",
    address: "",
    institutionType: "Public University",
    faculties_and_programmes: [],
    contacts: { email: [], phone: [] },
  };

  return {
    qualification: {
      qualId: 1,
      title: "Bachelor of Drama and Theatre Studies",
      nqfLevel: 7,
      nqfLevelRaw: "NQF Level 07",
      subfield: "Performing Arts",
      originator: "Stellenbosch University",
    },
    institution,
    ...overrides,
  };
}

describe("QualificationSearchResults", () => {
  it("renders nothing when there are no hits", () => {
    const { container } = render(<QualificationSearchResults hits={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a linked card per hit with the qualification title, institution name, and NQF level", () => {
    render(<QualificationSearchResults hits={[makeHit()]} />);

    expect(screen.getByText("Bachelor of Drama and Theatre Studies")).toBeInTheDocument();
    expect(screen.getByText("Stellenbosch University")).toBeInTheDocument();
    expect(screen.getByText(/NQF Level 7/i)).toBeInTheDocument();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/institutions/stellenbosch/qualifications?faculty=Performing+Arts");
  });

  it("URL-encodes an institution id containing '#' and '/' so the link isn't truncated at a URL fragment", () => {
    render(
      <QualificationSearchResults
        hits={[makeHit({ institution: { ...makeHit().institution, id: "INST#2000/HE07/015" } })]}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/institutions/INST%232000%2FHE07%2F015/qualifications?faculty=Performing+Arts",
    );
  });
});
