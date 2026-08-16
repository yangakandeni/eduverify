import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SavedInstitutionsList from "@/components/dashboard/SavedInstitutionsList";
import type { SavedInstitutionRecord } from "@/lib/dashboardData";
import type { InstitutionRecord } from "@/lib/types";

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

function makeRecord(overrides: Partial<SavedInstitutionRecord> = {}): SavedInstitutionRecord {
  return {
    institution: makeInstitution(),
    savedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("SavedInstitutionsList", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ saved: [] }) }),
    );
  });

  it("renders the clean display name, never the raw legal name with corporate suffixes", () => {
    render(<SavedInstitutionsList records={[makeRecord()]} />);

    expect(screen.getByText("Milpark Education")).toBeInTheDocument();
    expect(screen.queryByText("Milpark Education (Pty) Ltd")).not.toBeInTheDocument();
  });

  it("renders nothing once every saved institution has been removed", () => {
    const { container } = render(<SavedInstitutionsList records={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("removes an institution from the list and calls the delete API when unsaved", async () => {
    render(<SavedInstitutionsList records={[makeRecord()]} />);

    fireEvent.click(screen.getByRole("button", { name: /remove from saved/i }));

    await waitFor(() => expect(screen.queryByText("Milpark Education")).not.toBeInTheDocument());

    expect(fetch).toHaveBeenCalledWith(
      "/api/saved-institutions",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ institutionId: "milpark" }),
      }),
    );
  });

  it("opens the institution detail modal when its name is clicked", () => {
    render(<SavedInstitutionsList records={[makeRecord()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Milpark Education" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows 'Cancelled', not 'Provisionally Registered', for a saved institution whose registration was cancelled", () => {
    render(<SavedInstitutionsList records={[makeRecord({ institution: makeInstitution({ status: "Cancelled" }) })]} />);

    const badge = screen.getByText("Cancelled");
    expect(screen.queryByText("Provisionally Registered")).not.toBeInTheDocument();
    expect(badge).toHaveClass("bg-rose-50", "text-rose-700");
  });

  it("shows the first campus name instead of 'Unknown' for a multi-campus institution with an unresolved province", () => {
    render(
      <SavedInstitutionsList
        records={[
          makeRecord({
            institution: makeInstitution({
              province: "Unknown",
              address:
                "A) Sandton: Main Site, ADvTECH House, 54 Wierda Road West, Sandton, 2196. B) Randburg: 8 Rustenburg Road, Randburg.",
            }),
          }),
        ]}
      />,
    );

    expect(screen.getByText("Sandton")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("shows no 'Unknown' location for a saved institution with no address and no province", () => {
    render(
      <SavedInstitutionsList
        records={[makeRecord({ institution: makeInstitution({ address: "", province: null }) })]}
      />,
    );

    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });
});
