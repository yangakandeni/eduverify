import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InstitutionDetailModal from "@/components/InstitutionDetailModal";
import type { InstitutionRecord } from "@/lib/types";

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "milpark",
    name: "Milpark Education (Pty) Ltd",
    address: "1 Sturdee Avenue, Rosebank",
    province: "Gauteng",
    institutionType: "Private Higher Education Institution",
    qualifications: [],
    contacts: {
      email: ["jennifer.blake@milpark.ac.za"],
      phone: ["086 999 0001"],
      website: "www.milpark.ac.za",
    },
    ...overrides,
  };
}

describe("InstitutionDetailModal status badge", () => {
  it("shows 'Cancelled', not 'Provisionally Registered', for an institution whose registration was cancelled", () => {
    render(<InstitutionDetailModal institution={makeInstitution({ status: "Cancelled" })} onClose={vi.fn()} />);

    const badge = screen.getByText("Cancelled");
    expect(screen.queryByText("Provisionally Registered")).not.toBeInTheDocument();
    expect(badge.closest("div")).toHaveClass("bg-rose-50", "text-rose-700");
  });
});

describe("InstitutionDetailModal cancellation reason", () => {
  it("shows the DHET cancellation reason for a cancelled institution", () => {
    render(
      <InstitutionDetailModal
        institution={makeInstitution({
          status: "Cancelled",
          cancellation_reason: "no longer offers programmes aligned to the HEQSF.",
        })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("no longer offers programmes aligned to the HEQSF.")).toBeInTheDocument();
  });

  it("omits the cancellation reason section when none is present", () => {
    render(<InstitutionDetailModal institution={makeInstitution({ status: "Cancelled" })} onClose={vi.fn()} />);

    expect(screen.queryByText("Reason for cancellation")).not.toBeInTheDocument();
  });

  it("does not show a cancellation reason for an active institution", () => {
    render(
      <InstitutionDetailModal
        institution={makeInstitution({ status: "Registered", cancellation_reason: "should not render" })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("should not render")).not.toBeInTheDocument();
  });
});

describe("InstitutionDetailModal location label", () => {
  it("labels the province/campus field as Locations, not Province", () => {
    render(<InstitutionDetailModal institution={makeInstitution()} onClose={vi.fn()} />);

    expect(screen.getByText("Locations")).toBeInTheDocument();
    expect(screen.queryByText("Province")).not.toBeInTheDocument();
  });
});

describe("InstitutionDetailModal contact pill buttons", () => {
  it("renders Email, Call, and Qualifications pill buttons with correct link schemes", () => {
    render(<InstitutionDetailModal institution={makeInstitution()} onClose={vi.fn()} />);

    const emailLink = screen.getByRole("link", { name: /email/i });
    expect(emailLink).toHaveAttribute("href", "mailto:jennifer.blake@milpark.ac.za");

    const callLink = screen.getByRole("link", { name: /call/i });
    expect(callLink).toHaveAttribute("href", "tel:0869990001");

    const qualificationsLink = screen.getByRole("link", { name: /qualifications/i });
    expect(qualificationsLink).toHaveAttribute("href", "/institutions/milpark/qualifications");
  });

  it("omits the Email button when there is no email", () => {
    render(
      <InstitutionDetailModal
        institution={makeInstitution({ contacts: { email: [], phone: ["086 999 0001"], website: "www.milpark.ac.za" } })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /email/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /call/i })).toBeInTheDocument();
  });

  it("omits the Call button when there is no phone", () => {
    render(
      <InstitutionDetailModal
        institution={makeInstitution({
          contacts: { email: ["jennifer.blake@milpark.ac.za"], phone: [], website: "www.milpark.ac.za" },
        })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /call/i })).not.toBeInTheDocument();
  });

  it("always renders the Qualifications button, regardless of contact info", () => {
    render(
      <InstitutionDetailModal
        institution={makeInstitution({ contacts: { email: [], phone: [], website: null } })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /email/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /call/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /qualifications/i })).toBeInTheDocument();
  });

  it("no longer renders a direct Website link from the modal", () => {
    render(<InstitutionDetailModal institution={makeInstitution()} onClose={vi.fn()} />);

    expect(screen.queryByRole("link", { name: /^website$/i })).not.toBeInTheDocument();
  });
});
