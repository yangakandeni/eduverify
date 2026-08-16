import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import HeroShowcase from "@/components/HeroShowcase";
import type { InstitutionRecord } from "@/lib/types";

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "uct",
    name: "University of Cape Town",
    address: "Rondebosch",
    province: "Gauteng",
    institutionType: "Public University",
    faculties_and_programmes: [],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("HeroShowcase main card primary action button", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("labels the primary action 'Contact Info', not 'Verify Institution'", () => {
    render(<HeroShowcase institutions={[makeInstitution()]} onExplore={vi.fn()} />);

    expect(screen.getByRole("button", { name: /contact info/i })).toBeInTheDocument();
    expect(screen.queryByText(/verify institution/i)).not.toBeInTheDocument();
  });

  it("invokes onExplore when the 'Contact Info' button is clicked", () => {
    const onExplore = vi.fn();
    const institution = makeInstitution();
    render(<HeroShowcase institutions={[institution]} onExplore={onExplore} />);

    fireEvent.click(screen.getByRole("button", { name: /contact info/i }));

    expect(onExplore).toHaveBeenCalledWith(institution);
  });
});

describe("HeroShowcase main card status pill", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("shows 'Cancelled', not 'Provisionally Registered', for an institution whose registration was cancelled", () => {
    render(<HeroShowcase institutions={[makeInstitution({ status: "Cancelled" })]} onExplore={vi.fn()} />);

    const badge = screen.getByText("Cancelled");
    expect(screen.queryByText("Provisionally Registered")).not.toBeInTheDocument();
    expect(badge.closest("span")).toHaveClass("bg-rose-50", "text-rose-600");
  });
});

describe("HeroShowcase main card for a bogus/fake institution warning listing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("shows 'Fake - Not Registered' and disables both 'Contact Info' and 'Qualifications'", () => {
    const onExplore = vi.fn();
    const institution = makeInstitution({
      status: "Bogus",
      address: "",
      province: null,
      faculties_and_programmes: [],
      contacts: { email: [], phone: [], website: "example.com" },
    });
    render(<HeroShowcase institutions={[institution]} onExplore={onExplore} />);

    expect(screen.getByText("Fake - Not Registered")).toBeInTheDocument();

    const contactInfoButton = screen.getByRole("button", { name: /contact info/i });
    expect(contactInfoButton).toBeDisabled();
    fireEvent.click(contactInfoButton);
    expect(onExplore).not.toHaveBeenCalled();

    expect(screen.queryByRole("link", { name: /qualifications/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /qualifications/i })).toBeDisabled();
  });

  it("shows an enabled 'Qualifications' link pointing at the institution's qualifications page", () => {
    render(<HeroShowcase institutions={[makeInstitution()]} onExplore={vi.fn()} />);

    const qualificationsLink = screen.getByRole("link", { name: /qualifications/i });
    expect(qualificationsLink).toHaveAttribute("href", "/institutions/uct/qualifications");
  });
});

describe("HeroShowcase main card location", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("shows the first campus name instead of 'Unknown' for a multi-campus institution with an unresolved province", () => {
    const institution = makeInstitution({
      province: "Unknown",
      address:
        "A) Sandton: Main Site, ADvTECH House, 54 Wierda Road West, Sandton, 2196. B) Randburg: 8 Rustenburg Road, Randburg.",
    });
    render(<HeroShowcase institutions={[institution]} onExplore={vi.fn()} />);

    expect(screen.getByText("Sandton")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });
});

describe("HeroShowcase main card faculty pills", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("shows the institution's actual faculty names, not a keyword-guessed category", () => {
    const institution = makeInstitution({
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
    });
    render(<HeroShowcase institutions={[institution]} onExplore={vi.fn()} />);

    expect(screen.getByText("Design Studies")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.queryByText("Business")).not.toBeInTheDocument();
    expect(screen.queryByText("Arts")).not.toBeInTheDocument();
  });

  it("caps visible faculty pills at 9 and aggregates the rest into a '+N' pill", () => {
    const facultyNames = [
      "Faculty A",
      "Faculty B",
      "Faculty C",
      "Faculty D",
      "Faculty E",
      "Faculty F",
      "Faculty G",
      "Faculty H",
      "Faculty I",
      "Faculty J",
      "Faculty K",
      "Faculty L",
    ];
    const institution = makeInstitution({
      faculties_and_programmes: facultyNames.map((faculty, index) => ({
        faculty,
        programmes: [
          {
            qualId: index,
            title: `${faculty} Diploma`,
            nqfLevelRaw: "NQF Level 06",
            subfield: faculty,
            originator: "Test Institution",
          },
        ],
      })),
    });
    render(<HeroShowcase institutions={[institution]} onExplore={vi.fn()} />);

    const visibleFaculties = facultyNames.slice(0, 9);
    const overflowFaculties = facultyNames.slice(9);

    for (const faculty of visibleFaculties) {
      expect(screen.getByText(faculty)).toBeInTheDocument();
    }
    for (const faculty of overflowFaculties) {
      expect(screen.queryByText(faculty)).not.toBeInTheDocument();
    }
    expect(screen.getByText("+3")).toBeInTheDocument();
  });
});

describe("HeroShowcase supporting card status pill", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("shows 'Discontinued', not the hardcoded 'Cancelled', for a discontinued institution in the supporting list", () => {
    const main = makeInstitution({ id: "aaa", name: "Aaa University" });
    const supporting = makeInstitution({ id: "zzz", name: "Zzz Discontinued College", status: "Discontinued" });
    render(<HeroShowcase institutions={[main, supporting]} onExplore={vi.fn()} />);

    expect(screen.getByText("Discontinued")).toBeInTheDocument();
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
  });
});
