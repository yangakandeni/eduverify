import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BrowseHeader from "@/components/BrowseHeader";
import { ALL_STATUSES_VALUE, ALL_TYPES_VALUE } from "@/lib/browse";

function renderHeader(overrides: Partial<ComponentProps<typeof BrowseHeader>> = {}) {
  return render(
    <BrowseHeader
      resultCount={0}
      province=""
      institutionType={ALL_TYPES_VALUE}
      status={ALL_STATUSES_VALUE}
      onProvinceChange={vi.fn()}
      onInstitutionTypeChange={vi.fn()}
      onStatusChange={vi.fn()}
      filtersOpen
      onToggleFilters={vi.fn()}
      {...overrides}
    />,
  );
}

describe("BrowseHeader filters toggle", () => {
  it("calls onToggleFilters when the Filters button is clicked", () => {
    const onToggleFilters = vi.fn();
    renderHeader({ onToggleFilters });

    screen.getByRole("button", { name: /filters/i }).click();

    expect(onToggleFilters).toHaveBeenCalledOnce();
  });
});

describe("BrowseHeader province filter", () => {
  it("disables the province select when status is 'bogus'", () => {
    renderHeader({ status: "bogus" });

    expect(screen.getByLabelText("Province")).toBeDisabled();
  });

  it("keeps the province select enabled for any other status", () => {
    renderHeader({ status: "registered" });

    expect(screen.getByLabelText("Province")).toBeEnabled();
  });
});

describe("BrowseHeader status filter options", () => {
  it("disables every status but 'Registered' when institution type is 'Public University'", () => {
    renderHeader({ institutionType: "Public University" });

    const status = screen.getByLabelText("Status") as HTMLSelectElement;
    const options = Array.from(status.options);

    expect(options.find((option) => option.value === "registered")).not.toBeDisabled();
    expect(options.find((option) => option.value === "cancelled")).toBeDisabled();
    expect(options.find((option) => option.value === "discontinued")).toBeDisabled();
    expect(options.find((option) => option.value === "bogus")).toBeDisabled();
    expect(options.find((option) => option.value === "provisional")).toBeDisabled();
  });

  it("disables every status but 'Registered' when institution type is 'TVET College'", () => {
    renderHeader({ institutionType: "TVET College" });

    const status = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(Array.from(status.options).find((option) => option.value === "registered")).not.toBeDisabled();
    expect(Array.from(status.options).find((option) => option.value === "cancelled")).toBeDisabled();
  });

  it("leaves every status option enabled for 'Private Higher Education Institution'", () => {
    renderHeader({ institutionType: "Private Higher Education Institution" });

    const status = screen.getByLabelText("Status") as HTMLSelectElement;
    for (const option of Array.from(status.options)) {
      expect(option).not.toBeDisabled();
    }
  });

  it("leaves every status option enabled when institution type is 'All Types'", () => {
    renderHeader({ institutionType: ALL_TYPES_VALUE });

    const status = screen.getByLabelText("Status") as HTMLSelectElement;
    for (const option of Array.from(status.options)) {
      expect(option).not.toBeDisabled();
    }
  });
});
