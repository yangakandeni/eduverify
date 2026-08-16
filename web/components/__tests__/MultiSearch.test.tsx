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
    faculties_and_programmes: [],
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
    faculties_and_programmes: [],
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

  it("shows the clean display name, not the raw legal name, for a suggestion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "cat",
          results: [makeInstitution({ id: "cat-academy", name: "Cat Group (Pty) Ltd t/a CAT Academy" })],
          qualificationHits: [],
        }),
      }),
    );

    render(<MultiSearch institutions={[]} value="cat" onValueChange={noop} onSearch={noop} onClear={noop} />);

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));

    await waitFor(() => expect(screen.getByText("CAT Academy")).toBeInTheDocument(), { timeout: 1000 });
    expect(screen.queryByText("Cat Group (Pty) Ltd t/a CAT Academy")).not.toBeInTheDocument();
  });

  it("searches using the clean display name, not the raw legal name, when a suggestion is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: "cat",
          results: [makeInstitution({ id: "cat-academy", name: "Cat Group (Pty) Ltd t/a CAT Academy" })],
          qualificationHits: [],
        }),
      }),
    );

    const onSearch = vi.fn();
    const onValueChange = vi.fn();
    render(
      <MultiSearch institutions={[]} value="cat" onValueChange={onValueChange} onSearch={onSearch} onClear={noop} />,
    );

    fireEvent.focus(screen.getByPlaceholderText(/search by institution/i));
    await waitFor(() => expect(screen.getByText("CAT Academy")).toBeInTheDocument(), { timeout: 1000 });

    fireEvent.click(screen.getByText("CAT Academy"));

    expect(onValueChange).toHaveBeenCalledWith("CAT Academy");
    expect(onSearch).toHaveBeenCalledWith("CAT Academy");
  });
});
