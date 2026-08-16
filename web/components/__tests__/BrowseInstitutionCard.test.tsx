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

  it("shows 'Discontinued', not 'Cancelled', for an institution that requested its own registration be discontinued", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, qualifications: [] })}
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
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, qualifications: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("disables the 'More Info' button and does not invoke onVerify when clicked", () => {
    const onVerify = vi.fn();
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Discontinued", address: "", province: null, qualifications: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={onVerify}
      />,
    );

    const button = screen.getByRole("button", { name: /more info/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onVerify).not.toHaveBeenCalled();
  });

  it("shows a disabled 'Visit Website' button instead of hiding it, even though there's no website", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Cancelled", address: "", province: null, qualifications: [] })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /visit website/i });
    expect(button).toBeDisabled();
  });
});

describe("BrowseInstitutionCard for a fully-detailed register entry", () => {
  it("still shows the location row and keeps 'More Info' enabled", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Cancelled" })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.getByText("Gauteng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more info/i })).not.toBeDisabled();
  });

  it("still hides 'Visit Website' entirely (rather than disabling it) when there's simply no website on file", () => {
    render(
      <BrowseInstitutionCard
        institution={makeInstitution({ status: "Registered" })}
        saved={false}
        onToggleSaved={vi.fn()}
        onVerify={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /visit website/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /visit website/i })).not.toBeInTheDocument();
  });
});
