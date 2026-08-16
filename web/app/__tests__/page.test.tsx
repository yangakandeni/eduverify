import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

vi.mock("@/app/HomeClient", () => ({
  default: ({ initialQuery, initialPage }: { initialQuery?: string; initialPage?: number }) => (
    <div>
      <div data-testid="home-client">{initialQuery ?? "(none)"}</div>
      <div data-testid="home-client-page">{initialPage ?? "(none)"}</div>
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
});
