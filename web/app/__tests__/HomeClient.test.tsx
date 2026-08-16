import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeClient from "@/app/HomeClient";
import type { InstitutionRecord } from "@/lib/types";

vi.mock("@/components/HeroShowcase", () => ({
  default: ({ institutions }: { institutions: InstitutionRecord[] }) => (
    <div data-testid="hero">{institutions.map((institution) => institution.name).join(",")}</div>
  ),
}));
vi.mock("@/components/BrowseSection", () => ({
  default: ({ institutions }: { institutions: InstitutionRecord[] }) => (
    <div data-testid="browse">{institutions.length}</div>
  ),
}));
vi.mock("@/components/QualificationBrowser", () => ({ default: () => <div data-testid="qualification-browser" /> }));
vi.mock("@/components/MultiSearch", () => ({ default: () => <div data-testid="multi-search" /> }));
vi.mock("@/components/InstitutionDetailModal", () => ({ default: () => null }));

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

describe("HomeClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders institutions passed in via props immediately, without any loading state", () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    expect(screen.getByTestId("hero")).toHaveTextContent("Milpark Education (Pty) Ltd");
    expect(screen.queryByText(/loading the discovery portal/i)).not.toBeInTheDocument();
  });

  it("never calls the institutions API on mount — the data arrives pre-loaded from the server", () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/institutions"));
  });
});
