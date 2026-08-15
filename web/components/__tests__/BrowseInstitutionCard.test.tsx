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
    qualifications: [],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("BrowseInstitutionCard primary action button", () => {
  it("labels the primary action 'More Info', not 'Verify'", () => {
    render(<BrowseInstitutionCard institution={makeInstitution()} saved={false} onToggleSaved={vi.fn()} onVerify={vi.fn()} />);

    expect(screen.getByRole("button", { name: /more info/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^verify$/i })).not.toBeInTheDocument();
  });

  it("invokes onVerify when the 'More Info' button is clicked", () => {
    const onVerify = vi.fn();
    render(<BrowseInstitutionCard institution={makeInstitution()} saved={false} onToggleSaved={vi.fn()} onVerify={onVerify} />);

    fireEvent.click(screen.getByRole("button", { name: /more info/i }));

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
});
