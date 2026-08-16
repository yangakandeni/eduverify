import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MultiSearch from "@/components/MultiSearch";
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

const QUALIFICATION_HIT = {
  qualification: {
    qualId: 1,
    title: "Bachelor of Drama and Theatre Studies",
    nqfLevel: 7,
    nqfLevelRaw: "NQF Level 07",
    subfield: "Performing Arts",
    originator: "Stellenbosch University",
  },
  institution: {
    id: "stellenbosch",
    name: "Stellenbosch University",
    address: "",
    institutionType: "Public University",
    qualifications: [],
    contacts: { email: [], phone: [] },
  },
};

function noop() {}

describe("MultiSearch qualification suggestions", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "theatre",
          results: [makeInstitution()],
          qualificationHits: [QUALIFICATION_HIT],
        }),
      }),
    );
  });

  it("shows a 'Programmes' group with matching qualification suggestions while typing", async () => {
    render(
      <MultiSearch institutions={[]} value="theatre" onValueChange={noop} onSearch={noop} onClear={noop} />,
    );

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));

    await waitFor(() => expect(screen.getByText("Bachelor of Drama and Theatre Studies")).toBeInTheDocument(), {
      timeout: 1000,
    });

    expect(screen.getByText(/programmes/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /bachelor of drama and theatre studies/i });
    expect(link).toHaveAttribute("href", "/institutions/stellenbosch/qualifications?faculty=Performing+Arts");
  });
});

describe("MultiSearch institution suggestions", () => {
  it("does not show a location badge (which would otherwise read 'Unknown') when province is 'Unknown'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "fashion",
          results: [makeInstitution({ name: "The Online Fashion Design Institute", province: "Unknown" })],
          qualificationHits: [],
        }),
      }),
    );

    render(
      <MultiSearch institutions={[]} value="fashion" onValueChange={noop} onSearch={noop} onClear={noop} />,
    );

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));

    await waitFor(() => expect(screen.getByText("The Online Fashion Design Institute")).toBeInTheDocument(), {
      timeout: 1000,
    });

    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("does not show a location badge when province is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "fashion",
          results: [makeInstitution({ name: "The Online Fashion Design Institute", province: undefined })],
          qualificationHits: [],
        }),
      }),
    );

    render(
      <MultiSearch institutions={[]} value="fashion" onValueChange={noop} onSearch={noop} onClear={noop} />,
    );

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));

    await waitFor(() => expect(screen.getByText("The Online Fashion Design Institute")).toBeInTheDocument(), {
      timeout: 1000,
    });

    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("still shows the province when it is known", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "milpark",
          results: [makeInstitution({ province: "Gauteng" })],
          qualificationHits: [],
        }),
      }),
    );

    render(
      <MultiSearch institutions={[]} value="milpark" onValueChange={noop} onSearch={noop} onClear={noop} />,
    );

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));

    await waitFor(() => expect(screen.getByText("Gauteng")).toBeInTheDocument(), { timeout: 1000 });
  });
});
