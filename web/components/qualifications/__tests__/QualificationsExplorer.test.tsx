import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import QualificationsExplorer from "@/components/qualifications/QualificationsExplorer";
import type { FacultyQualificationGroup, SaqaQualification } from "@/lib/types";

function makeQualification(overrides: Partial<SaqaQualification> = {}): SaqaQualification {
  return {
    qualId: 1,
    title: "Diploma in Something",
    nqfLevelRaw: "NQF Level 06",
    subfield: "Arts",
    originator: "Fixture Institution",
    ...overrides,
  };
}

const MANY_COMMERCE_QUALIFICATIONS: SaqaQualification[] = Array.from({ length: 14 }, (_, index) =>
  makeQualification({
    qualId: 100 + index,
    title: `Commerce Qualification ${index + 1}`,
    subfield: "Commerce",
  }),
);

const GROUPS: FacultyQualificationGroup[] = [
  {
    faculty: "Arts",
    count: 1,
    qualifications: [makeQualification({ qualId: 1, title: "Diploma in Fine Art", subfield: "Arts" })],
  },
  {
    faculty: "Commerce",
    count: MANY_COMMERCE_QUALIFICATIONS.length,
    qualifications: MANY_COMMERCE_QUALIFICATIONS,
  },
];

describe("QualificationsExplorer", () => {
  it("defaults to the first faculty when no initial faculty is given", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} />);

    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /arts/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("selects the requested initial faculty when it matches a group", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    expect(screen.getByRole("button", { name: /commerce/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
  });

  it("falls back to the first faculty when the requested initial faculty doesn't exist", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Medicine" />);

    expect(screen.getByRole("button", { name: /arts/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches the visible qualifications when a different faculty is clicked", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} />);

    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(screen.queryByText("Diploma in Fine Art")).not.toBeInTheDocument();
    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
  });

  it("filters the grid by search text within the selected faculty only", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Qualification 5" } });

    expect(screen.getByText("Commerce Qualification 5")).toBeInTheDocument();
    expect(screen.queryByText("Commerce Qualification 1")).not.toBeInTheDocument();
  });

  it("does not match a search query against a title that only exists in a different faculty", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Commerce" } });

    expect(screen.getByText(/no qualifications/i)).toBeInTheDocument();
  });

  it("paginates at 12 items per page and advances on click", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
    expect(screen.queryByText("Commerce Qualification 13")).not.toBeInTheDocument();

    const pagination = screen.getByRole("navigation", { name: /pagination/i });
    fireEvent.click(within(pagination).getByRole("button", { name: "2" }));

    expect(screen.getByText("Commerce Qualification 13")).toBeInTheDocument();
    expect(screen.queryByText("Commerce Qualification 1")).not.toBeInTheDocument();
  });

  it("resets pagination to page 1 when switching faculty", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    const pagination = screen.getByRole("navigation", { name: /pagination/i });
    fireEvent.click(within(pagination).getByRole("button", { name: "2" }));
    expect(screen.getByText("Commerce Qualification 13")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /arts/i }));
    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
  });

  it("resets pagination to page 1 when the search query changes", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    const pagination = screen.getByRole("navigation", { name: /pagination/i });
    fireEvent.click(within(pagination).getByRole("button", { name: "2" }));
    expect(screen.getByText("Commerce Qualification 13")).toBeInTheDocument();

    // Still 14 matches (2 pages), so landing back on page 1 proves the explicit
    // reset fired rather than the page merely clamping down to a shorter list.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Commerce Qualification" } });

    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
    expect(screen.queryByText("Commerce Qualification 13")).not.toBeInTheDocument();
  });

  it("does not clear the search box when the faculty selection changes", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "keep me" } });

    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(search).toHaveValue("keep me");
  });

  it("keeps a fixed search placeholder regardless of which faculty is selected", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");
    expect(search).toHaveAttribute("placeholder", "Search qualifications...");

    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(search).toHaveAttribute("placeholder", "Search qualifications...");
  });
});
