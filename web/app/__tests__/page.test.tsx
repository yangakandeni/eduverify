import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import type { InstitutionRecord } from "@/lib/types";

vi.mock("@/app/HomeClient", () => ({
  default: ({
    initialQuery,
    initialPage,
    initialInstitutions,
  }: {
    initialQuery?: string;
    initialPage?: number;
    initialInstitutions: InstitutionRecord[];
  }) => (
    <div>
      <div data-testid="home-client">{initialQuery ?? "(none)"}</div>
      <div data-testid="home-client-page">{initialPage ?? "(none)"}</div>
      <div data-testid="home-client-institutions">{initialInstitutions.length}</div>
    </div>
  ),
}));

describe("Home", () => {
  it("passes the 'q' search param through to HomeClient as initialQuery", async () => {
    render(await Home({ searchParams: Promise.resolve({ q: "chemical" }) }));

    expect(screen.getByTestId("home-client")).toHaveTextContent("chemical");
  });

  it("passes no initialQuery to HomeClient when 'q' is absent", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("home-client")).toHaveTextContent("(none)");
  });

  it("passes the 'page' search param through to HomeClient as a parsed initialPage number", async () => {
    render(await Home({ searchParams: Promise.resolve({ q: "chemical", page: "5" }) }));

    expect(screen.getByTestId("home-client-page")).toHaveTextContent("5");
  });

  it("passes no initialPage when 'page' is absent or not a valid positive integer", async () => {
    render(await Home({ searchParams: Promise.resolve({ q: "chemical", page: "not-a-number" }) }));

    expect(screen.getByTestId("home-client-page")).toHaveTextContent("(none)");
  });

  it("passes the bundled local institutions through to HomeClient (USE_EXTERNAL_API unset)", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    const count = Number(screen.getByTestId("home-client-institutions").textContent);
    expect(count).toBeGreaterThan(0);
  });
});

describe("Home with getAllInstitutions mocked", () => {
  it("awaits getAllInstitutions() and passes its result through as initialInstitutions", async () => {
    vi.resetModules();
    vi.doMock("@/lib/institutions", () => ({
      getAllInstitutions: vi.fn().mockResolvedValue([{ id: "a" }, { id: "b" }]),
    }));

    const { default: HomeWithMockedInstitutions } = await import("@/app/page");
    render(await HomeWithMockedInstitutions({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("home-client-institutions")).toHaveTextContent("2");

    vi.doUnmock("@/lib/institutions");
  });
});
