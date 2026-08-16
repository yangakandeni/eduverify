import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationsPage from "@/app/institutions/[id]/qualifications/page";
import { ALL_INSTITUTIONS } from "@/lib/localData";
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

  it("carries the 'q' search term forward on the 'Back' link, so returning restores the matching search", async () => {
    render(
      await QualificationsPage({
        params: Promise.resolve({ id: stellenbosch.id }),
        searchParams: Promise.resolve({ q: "chemical" }),
      }),
    );

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/?q=chemical");
  });

  it("carries the 'page' param forward on the 'Back' link alongside 'q', so returning lands on the same results page", async () => {
    render(
      await QualificationsPage({
        params: Promise.resolve({ id: stellenbosch.id }),
        searchParams: Promise.resolve({ q: "chemical", page: "10" }),
      }),
    );

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/?q=chemical&page=10");
  });

  it("omits the 'page' param on the 'Back' link when there is no active search, even if a page value is somehow present", async () => {
    render(
      await QualificationsPage({
        params: Promise.resolve({ id: stellenbosch.id }),
        searchParams: Promise.resolve({ page: "10" }),
      }),
    );

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/");
  });

  it("renders the institution's display name as a larger, more prominent heading", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Stellenbosch University");
    expect(heading).toHaveClass("text-3xl");
  });

  it("does not render a redundant 'Qualifications & Faculties' header above the faculty list", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    expect(screen.queryByText(/qualifications & faculties/i)).not.toBeInTheDocument();
  });

  it("defaults to 'All Qualifications' selected when no faculty is requested, while still listing individual faculties to browse", async () => {
    render(await QualificationsPage({ params: Promise.resolve({ id: stellenbosch.id }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: /all qualifications/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /adult learning/i })).toBeInTheDocument();
  });

  it("pre-filters qualifications by the 'q' search param when provided", async () => {
    render(
      await QualificationsPage({
        params: Promise.resolve({ id: stellenbosch.id }),
        searchParams: Promise.resolve({ q: "drama" }),
      }),
    );

    expect(screen.getByRole("searchbox")).toHaveValue("drama");
    expect(screen.getByText("Master of Arts in Drama and Theatre Studies")).toBeInTheDocument();
  });

  it("calls notFound when the institution doesn't exist", async () => {
    await expect(
      QualificationsPage({ params: Promise.resolve({ id: "does-not-exist" }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();
  });
});
