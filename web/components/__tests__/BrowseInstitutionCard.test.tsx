import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BrowseInstitutionCard from "@/components/BrowseInstitutionCard";
import type { InstitutionRecord } from "@/lib/types";

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "milpark",
    name: "Milpark Education (Pty) Ltd",
    address: "1 Sturdee Avenue, Rosebank",
    province: "Gauteng",
    institutionType: "Private Higher Education Institution",
    faculties_and_programmes: [],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("BrowseInstitutionCard primary action button", () => {
  it("labels the primary action 'Contact Info', not 'Verify'", () => {
    render(<BrowseInstitutionCard institution={makeInstitution()} saved={false} onToggleSaved={vi.fn()} onVerify={vi.fn()} />);

    expect(screen.getByRole("button", { name: /contact info/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^verify$/i })).not.toBeInTheDocument();
  });

  it("invokes onVerify when the 'Contact Info' button is clicked", () => {
    const onVerify = vi.fn();
    render(<BrowseInstitutionCard institution={makeInstitution()} saved={false} onToggleSaved={vi.fn()} onVerify={onVerify} />);

    fireEvent.click(screen.getByRole("button", { name: /contact info/i }));

    expect(onVerify).toHaveBeenCalledTimes(1);
  });
});

describe("BrowseInstitutionCard status badge", () => {
  it("shows 'Cancelled', not 'Provisionally Registered', for an institution whose registration was cancelled", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Cancelled" })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const badge = screen.getByText("Cancelled");
    expect(screen.queryByText("Provisionally Registered")).not.toBeInTheDocument();
    expect(badge.closest("div")).toHaveClass("bg-rose-50", "text-rose-700");
  });

  it("shows 'Discontinued', not 'Cancelled', for an institution that requested its own registration be discontinued", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByText("Discontinued")).toBeInTheDocument();
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
  });
});

describe("BrowseInstitutionCard for a name-only register entry (no address/qualifications)", () => {
  it("does not show a location row (which would otherwise read 'Unknown')", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("disables the 'Contact Info' button and does not invoke onVerify when clicked", () => {
    const onVerify = vi.fn();
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={onVerify}
      />,
    );

    const button = screen.getByRole("button", { name: /contact info/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onVerify).not.toHaveBeenCalled();
  });

  it("shows a disabled 'Qualifications' button instead of hiding it, when there's no further information available", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Cancelled", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /qualifications/i });
    expect(button).toBeDisabled();
  });
});

describe("BrowseInstitutionCard for a name-only entry that still has matched qualifications", () => {
  it("disables 'Contact Info' and shows no 'Unknown' location, but keeps 'Qualifications' enabled since real data exists", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({
          status: "Discontinued",
          address: "",
          province: null,
          faculties_and_programmes: [
            {
              faculty: "General",
              programmes: [
                { qualId: 1, title: "Diploma in Somewhere", nqfLevelRaw: "NQF Level 06", subfield: "General", originator: "" },
              ],
            },
          ],
        })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /contact info/i })).toBeDisabled();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /qualifications/i })).toHaveAttribute(
      "href",
      "/institutions/milpark/qualifications",
    );
  });
});

describe("BrowseInstitutionCard for a bogus/fake institution warning listing", () => {
  it("shows 'Fake - Not Registered' instead of the unclear 'Bogus' label", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Bogus", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByText("Fake - Not Registered")).toBeInTheDocument();
    expect(screen.queryByText("Bogus")).not.toBeInTheDocument();
  });

  it("disables both the 'Contact Info' and 'Qualifications' buttons", () => {
    const onVerify = vi.fn();
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Bogus", address: "", province: null, faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={onVerify}
      />,
    );

    const contactInfoButton = screen.getByRole("button", { name: /contact info/i });
    const qualificationsButton = screen.getByRole("button", { name: /qualifications/i });
    expect(contactInfoButton).toBeDisabled();
    expect(qualificationsButton).toBeDisabled();

    fireEvent.click(contactInfoButton);
    expect(onVerify).not.toHaveBeenCalled();
  });
});

describe("BrowseInstitutionCard for a multi-campus institution with an unresolved province", () => {
  it("shows the first campus name instead of 'Unknown'", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({
          province: "Unknown",
          address:
            "A) Sandton: Main Site, ADvTECH House, 54 Wierda Road West, Sandton, 2196. B) Randburg: 8 Rustenburg Road, Randburg.",
        })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByText("Sandton")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });
});

describe("BrowseInstitutionCard faculty pills", () => {
  it("does not show any faculty pills, since they don't correspond to why a search matched", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({
          faculties_and_programmes: [
            {
              faculty: "Design Studies",
              programmes: [
                {
                  qualId: 101589,
                  title: "Higher Certificate in Visual Communication",
                  nqfLevelRaw: "NQF Level 05",
                  subfield: "Design Studies",
                  originator: "AAA School of Advertising",
                },
              ],
            },
            {
              faculty: "Marketing",
              programmes: [
                {
                  qualId: 117964,
                  title: "Bachelor of Arts in Creative Brand Communication",
                  nqfLevelRaw: "NQF Level 07",
                  subfield: "Marketing",
                  originator: "AAA School of Advertising",
                },
              ],
            },
          ],
        })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.queryByText("Design Studies")).not.toBeInTheDocument();
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
  });
});

const SAMPLE_FACULTIES = [
  {
    faculty: "General",
    programmes: [
      { qualId: 1, title: "Diploma in Somewhere", nqfLevelRaw: "NQF Level 06", subfield: "General", originator: "" },
    ],
  },
];

describe("BrowseInstitutionCard for a fully-detailed register entry", () => {
  it("still shows the location row and keeps 'Contact Info' enabled", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Cancelled" })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByText("Gauteng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /contact info/i })).not.toBeDisabled();
  });

  it("shows an enabled 'Qualifications' link pointing at the institution's qualifications page, regardless of whether a website is on file", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: SAMPLE_FACULTIES })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const qualificationsLink = screen.getByRole("link", { name: /qualifications/i });
    expect(qualificationsLink).toHaveAttribute("href", "/institutions/milpark/qualifications");
  });

  it("URL-encodes an institution id containing '#' and '/' so the link isn't truncated at a URL fragment", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({
          id: "INST#2000/HE07/015",
          status: "Registered",
          faculties_and_programmes: SAMPLE_FACULTIES,
        })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const qualificationsLink = screen.getByRole("link", { name: /qualifications/i });
    expect(qualificationsLink).toHaveAttribute(
      "href",
      "/institutions/INST%232000%2FHE07%2F015/qualifications",
    );
  });
});

describe("BrowseInstitutionCard qualifications button under an active search query", () => {
  it("reads 'View Qualification' and carries the search term as a 'q' param when a query is active", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: SAMPLE_FACULTIES })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
        query="fine art"
      />,
    );

    const link = screen.getByRole("link", { name: /view qualification/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications?q=fine+art");
    expect(screen.queryByRole("link", { name: /^qualifications$/i })).not.toBeInTheDocument();
  });

  it("carries the current results page as a 'page' param when on a page beyond the first", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: SAMPLE_FACULTIES })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
        query="fine art"
        page={10}
      />,
    );

    const link = screen.getByRole("link", { name: /view qualification/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications?q=fine+art&page=10");
  });

  it("omits the 'page' param when on the first page, to keep the URL clean", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: SAMPLE_FACULTIES })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
        query="fine art"
        page={1}
      />,
    );

    const link = screen.getByRole("link", { name: /view qualification/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications?q=fine+art");
  });

  it("falls back to plain 'Qualifications' with no 'q' param when no query is active", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: SAMPLE_FACULTIES })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: /^qualifications$/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications");
    expect(screen.queryByRole("link", { name: /view qualification/i })).not.toBeInTheDocument();
  });

  it("keeps the disabled 'Qualifications' button unchanged when there's nothing to view, even with an active query", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
        query="fine art"
      />,
    );

    const button = screen.getByRole("button", { name: /^qualifications$/i });
    expect(button).toBeDisabled();
    expect(screen.queryByRole("link", { name: /view qualification/i })).not.toBeInTheDocument();
  });
});

describe("BrowseInstitutionCard for an institution with an address but no matched qualifications", () => {
  it("disables the 'Qualifications' button with a 'No qualifications listed' tooltip instead of linking to an empty page", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered", faculties_and_programmes: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /qualifications/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "No qualifications listed");
    expect(screen.queryByRole("link", { name: /qualifications/i })).not.toBeInTheDocument();
  });
});
