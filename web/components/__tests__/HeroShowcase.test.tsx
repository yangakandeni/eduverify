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
    qualifications: [],
    contacts: { email: [], phone: [] },
    ...overrides,
  };
}

describe("HeroShowcase main card primary action button", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")));
  });

  it("labels the primary action 'More Info', not 'Verify Institution'", () => {
    render(<HeroShowcase institutions={[makeInstitution()]} onExplore={vi.fn()} />);

    expect(screen.getByRole("button", { name: /more info/i })).toBeInTheDocument();
    expect(screen.queryByText(/verify institution/i)).not.toBeInTheDocument();
  });

  it("invokes onExplore when the 'More Info' button is clicked", () => {
    const onExplore = vi.fn();
    const institution = makeInstitution();
    render(<HeroShowcase institutions={[institution]} onExplore={onExplore} />);

    fireEvent.click(screen.getByRole("button", { name: /more info/i }));

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
