import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import BrowseSection from "@/components/BrowseSection";
import type { InstitutionRecord } from "@/lib/types";

vi.mock("@/lib/savedInstitutions", () => ({
  useSavedInstitutions: () => [new Set(), vi.fn()],
}));

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "milpark",
    name: "Milpark Education (Pty) Ltd",
    address: "1 Sturdee Avenue, Rosebank",
    province: "Gauteng",
    institutionType: "Private Higher Education Institution",
    faculties_and_programmes: [
      {
        faculty: "General",
        programmes: [
          { qualId: 1, title: "Diploma in Somewhere", nqfLevelRaw: "NQF Level 06", subfield: "General", originator: "" },
        ],
      },
    ],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("BrowseSection empty state", () => {
  it("links out to both DHET and SAQA when a search query has no results", () => {
    render(
      <BrowseSection
        institutions={[]}
        query="doesnotexist"
        onVerify={vi.fn()}
        onClearSearch={vi.fn()}
      />,
    );

    const dhetLink = screen.getByRole("link", { name: "www.dhet.gov.za" });
    expect(dhetLink).toHaveAttribute("href", "https://www.dhet.gov.za");

    const saqaLink = screen.getByRole("link", { name: "www.saqa.org.za" });
    expect(saqaLink).toHaveAttribute("href", "https://www.saqa.org.za");
  });
});

describe("BrowseSection error state", () => {
  it("shows a service-unavailable message instead of the empty state when error is set", () => {
    render(<BrowseSection institutions={[]} query="cape town" error onVerify={vi.fn()} />);

    expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No institutions found")).not.toBeInTheDocument();
  });

  it("takes precedence over the loading state", () => {
    render(<BrowseSection institutions={[]} loading error onVerify={vi.fn()} />);

    expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Checking the register...")).not.toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<BrowseSection institutions={[]} error onRetry={onRetry} onVerify={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show an error state when error is false, even with zero institutions", () => {
    render(<BrowseSection institutions={[]} onVerify={vi.fn()} />);

    expect(screen.queryByText("Service temporarily unavailable")).not.toBeInTheDocument();
    expect(screen.getByText("No institutions found")).toBeInTheDocument();
  });
});

describe("BrowseSection loading state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with 'Checking the register...'", () => {
    render(<BrowseSection institutions={[]} loading onVerify={vi.fn()} />);

    expect(screen.getByText("Checking the register...")).toBeInTheDocument();
  });

  it("does not show a misleading '0 institutions found' while a search is still in flight", () => {
    render(<BrowseSection institutions={[]} query="cape town" loading onVerify={vi.fn()} />);

    expect(screen.queryByText(/institutions? found/)).not.toBeInTheDocument();
  });

  it("escalates the status message the longer the search stays in flight", () => {
    render(<BrowseSection institutions={[]} loading onVerify={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("Verifying...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("Just a sec...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("Almost there...")).toBeInTheDocument();
  });

  it("resets back to the initial message on a fresh load after a previous one finished", () => {
    const { rerender } = render(<BrowseSection institutions={[]} loading onVerify={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("Just a sec...")).toBeInTheDocument();

    rerender(<BrowseSection institutions={[]} loading={false} onVerify={vi.fn()} />);
    rerender(<BrowseSection institutions={[]} loading onVerify={vi.fn()} />);

    expect(screen.getByText("Checking the register...")).toBeInTheDocument();
  });
});

describe("BrowseSection filters panel", () => {
  it("shows the filters expanded by default, with no click needed", () => {
    render(<BrowseSection institutions={[]} onVerify={vi.fn()} />);

    expect(screen.getByLabelText("Province")).toBeInTheDocument();
    expect(screen.getByLabelText("Institution Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("hides the filters once the Filters button is clicked", () => {
    render(<BrowseSection institutions={[]} onVerify={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.queryByLabelText("Province")).not.toBeInTheDocument();
  });
});

describe("BrowseSection status/province filter interaction", () => {
  it("resets the province filter to 'All Provinces' when status is set to 'Fake - Not Registered'", () => {
    render(<BrowseSection institutions={[]} onVerify={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Province"), { target: { value: "Gauteng" } });
    expect(screen.getByLabelText("Province")).toHaveValue("Gauteng");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "bogus" } });

    expect(screen.getByLabelText("Province")).toHaveValue("");
    expect(screen.getByLabelText("Province")).toBeDisabled();
  });
});

describe("BrowseSection institution-type/status filter interaction", () => {
  it("resets the status filter to 'All Statuses' when institution type becomes one that can't have that status", () => {
    render(<BrowseSection institutions={[]} onVerify={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "cancelled" } });
    expect(screen.getByLabelText("Status")).toHaveValue("cancelled");

    fireEvent.change(screen.getByLabelText("Institution Type"), { target: { value: "Public University" } });

    expect(screen.getByLabelText("Status")).toHaveValue("");
  });
});

describe("BrowseSection forwards the active query to institution cards", () => {
  it("shows 'View Qualification' with the search term carried through when the query matched a qualification", () => {
    render(<BrowseSection institutions={[makeInstitution()]} query="diploma" onVerify={vi.fn()} />);

    const link = screen.getByRole("link", { name: /view qualification/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications?q=diploma");
  });

  it("shows plain 'Qualifications' with no query param when browsing without a search term", () => {
    render(<BrowseSection institutions={[makeInstitution()]} onVerify={vi.fn()} />);

    const link = screen.getByRole("link", { name: /^qualifications$/i });
    expect(link).toHaveAttribute("href", "/institutions/milpark/qualifications");
  });
});

const MANY_INSTITUTIONS: InstitutionRecord[] = Array.from({ length: 13 }, (_, index) =>
  makeInstitution({ id: `inst-${index + 1}`, name: `Institution ${index + 1}` }),
);

describe("BrowseSection pagination state", () => {
  it("starts on the given initialPage instead of always defaulting to page 1", () => {
    render(<BrowseSection institutions={MANY_INSTITUTIONS} query="diploma" initialPage={2} onVerify={vi.fn()} />);

    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Institution 7")).toBeInTheDocument();
    expect(screen.queryByText("Institution 1")).not.toBeInTheDocument();
  });

  it("carries the current page into each card's 'View Qualification' link", () => {
    render(<BrowseSection institutions={MANY_INSTITUTIONS} query="diploma" initialPage={2} onVerify={vi.fn()} />);

    const links = screen.getAllByRole("link", { name: /view qualification/i });
    expect(links[0]).toHaveAttribute("href", "/institutions/inst-7/qualifications?q=diploma&page=2");
  });

  it("calls onPageChange when the user clicks a different page", () => {
    const onPageChange = vi.fn();
    render(
      <BrowseSection institutions={MANY_INSTITUTIONS} query="diploma" onPageChange={onPageChange} onVerify={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange(1) when a filter change resets pagination away from a later page", () => {
    const onPageChange = vi.fn();
    render(
      <BrowseSection
        institutions={MANY_INSTITUTIONS}
        query="diploma"
        initialPage={2}
        onPageChange={onPageChange}
        onVerify={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Province"), { target: { value: "Gauteng" } });

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
