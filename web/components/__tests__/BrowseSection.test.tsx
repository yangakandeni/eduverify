import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
