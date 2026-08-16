import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BrowseSection from "@/components/BrowseSection";

vi.mock("@/lib/savedInstitutions", () => ({
  useSavedInstitutions: () => [new Set(), vi.fn()],
}));

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
