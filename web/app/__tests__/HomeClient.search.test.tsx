import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeClient from "@/app/HomeClient";
import type { InstitutionRecord } from "@/lib/types";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));

vi.mock("@/components/HeroShowcase", () => ({ default: () => <div data-testid="hero" /> }));
vi.mock("@/components/BrowseSection", () => ({
  default: ({
    institutions,
    initialPage,
    error,
    onPageChange,
    onRetry,
  }: {
    institutions: InstitutionRecord[];
    initialPage?: number;
    error?: boolean;
    onPageChange?: (page: number) => void;
    onRetry?: () => void;
  }) => (
    <div>
      <div data-testid="browse">{institutions.map((institution) => institution.name).join(",")}</div>
      <div data-testid="initial-page">{initialPage ?? "(none)"}</div>
      <div data-testid="browse-error">{error ? "error" : "(none)"}</div>
      <button type="button" onClick={() => onPageChange?.(3)}>
        go-to-page-3
      </button>
      <button type="button" onClick={() => onRetry?.()}>
        retry
      </button>
    </div>
  ),
}));
vi.mock("@/components/QualificationBrowser", () => ({ default: () => <div data-testid="qualification-browser" /> }));
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

describe("HomeClient search (real MultiSearch)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          results: [makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" })],
          qualificationHits: [
            {
              qualification: { qualId: 1, title: "Diploma in Fine Art", nqfLevelRaw: "NQF Level 06", subfield: "Arts", originator: "" },
              institution: makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" }),
            },
          ],
        }),
      }),
    );
  });

  it("does not render a 'Matching Programmes' section after a search completes, even though qualificationHits are returned", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    expect(screen.queryByText(/matching programmes/i)).not.toBeInTheDocument();
  });

  it("syncs the search term into the URL when a search is submitted, so back-navigation can restore it", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("q=fine+art"), { scroll: false });
  });

  it("clears the URL query param when the search is cleared", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    const input = screen.getByPlaceholderText(/search by institution, qualification, or province/i);
    fireEvent.change(input, { target: { value: "fine art" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    expect(mockReplace).toHaveBeenCalledWith("/", { scroll: false });
  });
});

describe("HomeClient search failure", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows the browse error state when the search API returns a service_unavailable body, instead of treating it as zero results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "service_unavailable", message: "down" }),
      }),
    );
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(screen.getByTestId("browse-error")).toHaveTextContent("error"));
  });

  it("shows the browse error state when the fetch itself throws (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network error")));
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(screen.getByTestId("browse-error")).toHaveTextContent("error"));
  });

  it("retries the same query when BrowseSection's retry action is triggered", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ error: "service_unavailable" }) })
      .mockResolvedValueOnce({
        json: async () => ({ results: [makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" })] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => expect(screen.getByTestId("browse-error")).toHaveTextContent("error"));

    fireEvent.click(screen.getByRole("button", { name: "retry" }));

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("q=fine+art");
  });
});

describe("HomeClient restoring a search from the URL (initialQuery)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          results: [makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" })],
          qualificationHits: [],
        }),
      }),
    );
  });

  it("auto-runs the search on mount when initialQuery is provided, restoring the previous results", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} initialQuery="chemical" />);

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=chemical"));
    expect(screen.getByPlaceholderText(/search by institution, qualification, or province/i)).toHaveValue("chemical");
  });

  it("does not call /api/search on mount when no initialQuery is provided", () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/search"));
  });

  it("forwards initialPage to BrowseSection so it lands on the same page it left off on", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} initialQuery="chemical" initialPage={5} />);

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    expect(screen.getByTestId("initial-page")).toHaveTextContent("5");
  });

  it("preserves the page number in the URL when restoring a search from a cold load", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} initialQuery="chemical" initialPage={5} />);

    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));

    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("page=5"), { scroll: false });
  });
});

describe("HomeClient pagination URL sync", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          results: [makeInstitution({ id: "fine-arts-college", name: "Fine Arts College" })],
          qualificationHits: [],
        }),
      }),
    );
  });

  it("syncs the page number into the URL, preserving the search term, when the browse grid reports a page change", async () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.change(screen.getByPlaceholderText(/search by institution, qualification, or province/i), {
      target: { value: "fine art" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => expect(screen.getByTestId("browse")).toHaveTextContent("Fine Arts College"));
    mockReplace.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "go-to-page-3" }));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/^\/\?.*q=fine\+art.*page=3|^\/\?.*page=3.*q=fine\+art/),
      { scroll: false },
    );
  });

  it("does not sync a page change into the URL when no search is active", () => {
    render(<HomeClient initialInstitutions={[makeInstitution()]} />);

    fireEvent.click(screen.getByRole("button", { name: "go-to-page-3" }));

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
