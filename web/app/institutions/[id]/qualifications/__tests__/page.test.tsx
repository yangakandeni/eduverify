import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationsPage from "@/app/institutions/[id]/qualifications/page";
import { ALL_INSTITUTIONS } from "@/lib/localData";
import { getBrandColor } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

function requireInstitutionByName(name: string): InstitutionRecord {
  const institution = ALL_INSTITUTIONS.find((candidate) => candidate.name === name);
  if (!institution) throw new Error(`Expected fixture institution "${name}" to exist in ALL_INSTITUTIONS`);
  return institution;
}

const stellenbosch = requireInstitutionByName("Stellenbosch University");

vi.mock("@/lib/institutions", () => ({
  getInstitution: vi.fn(async (id: string) => (id === stellenbosch.id ? stellenbosch : null)),
}));

describe("QualificationsPage", () => {
  it("renders a 'Back' link to the homepage", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/");
  });

  it("renders the institution's display name as a larger, more prominent heading", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Stellenbosch University");
    expect(heading).toHaveClass("text-3xl");
  });

  it("styles the sidebar's 'Qualifications & Faculties' header with the institution's brand color", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    const header = screen.getByText(/qualifications & faculties/i);
    expect(header).toHaveStyle({ color: getBrandColor(stellenbosch) });
  });

  it("shows the first faculty's qualifications by default when no faculty is requested", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: /adult learning/i })).toBeInTheDocument();
  });

  it("calls notFound when the institution doesn't exist", async () => {
    await expect(
      QualificationsPage({ params: Promise.resolve({ id: "does-not-exist" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();
  });
});
