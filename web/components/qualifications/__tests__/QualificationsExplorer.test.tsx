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
    count: 7,
    qualifications: [
      makeQualification({ qualId: 1, title: "Diploma in Fine Art", subfield: "Arts" }),
      makeQualification({ qualId: 2, title: "Diploma in Education", subfield: "Arts" }),
      makeQualification({ qualId: 3, title: "Bachelor of Architecture", subfield: "Arts" }),
      makeQualification({ qualId: 4, title: "National Diploma in Engineering", subfield: "Arts" }),
      makeQualification({ qualId: 5, title: "Doctor of Philosophy in Education", subfield: "Arts" }),
      makeQualification({ qualId: 6, title: "Diploma: 3-D Design and Digital Animation", subfield: "Arts" }),
      makeQualification({ qualId: 7, title: "Bachelor of Science in Physics", subfield: "Arts" }),
    ],
  },
  {
    faculty: "Commerce",
    count: MANY_COMMERCE_QUALIFICATIONS.length,
    qualifications: MANY_COMMERCE_QUALIFICATIONS,
  },
];

describe("QualificationsExplorer", () => {
  it("defaults to 'All Qualifications' selected when no initial faculty is given, showing every faculty's items", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} />);

    expect(screen.getByRole("button", { name: /all qualifications/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
  });

  it("selects the requested initial faculty when it matches a group", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Commerce" />);

    expect(screen.getByRole("button", { name: /commerce/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
  });

  it("falls back to 'All Qualifications' when the requested initial faculty doesn't exist", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Medicine" />);

    expect(screen.getByRole("button", { name: /all qualifications/i })).toHaveAttribute("aria-pressed", "true");
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

  it("keeps showing the previous results when a search query matches nothing in the selected faculty", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Commerce" } });

    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.queryByText(/no qualifications/i)).not.toBeInTheDocument();
  });

  it("freezes the grid on the last non-empty results while typing produces no new matches, then updates once a new match appears", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "a" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ar" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "arc" } });
    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();
    expect(screen.queryByText("Diploma in Fine Art")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ar" } });
    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();
    expect(screen.queryByText("Diploma in Fine Art")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "art" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
    expect(screen.queryByText("Bachelor of Architecture")).not.toBeInTheDocument();
  });

  it("shows no 'Results for' heading before any search is entered", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    expect(screen.queryByText(/results for/i)).not.toBeInTheDocument();
  });

  it("shows a 'Results for \"<query>\"' heading above the matches once a search applies", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "art" } });

    expect(screen.getByText('Results for "art"')).toBeInTheDocument();
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
  });

  it("shows a 'Results for \"moooo\"' heading alongside the no-qualifications-found state when a forced search matches nothing, mirroring the homepage's search-with-no-results treatment", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "moooo" } });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(screen.getByText('Results for "moooo"')).toBeInTheDocument();
    expect(screen.getByText(/no qualifications found/i)).toBeInTheDocument();
  });

  it("keeps the 'Results for' heading pinned to the applied query, not the frozen live input, while typing produces no new matches", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "art" } });
    expect(screen.getByText('Results for "art"')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ar" } });

    expect(screen.getByText('Results for "art"')).toBeInTheDocument();
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();
  });

  it("lets Enter override the freeze and force a search with the current input, showing the no-results state when it matches nothing", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "art" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ar" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Enter" });

    expect(screen.queryByText("Diploma in Fine Art")).not.toBeInTheDocument();
    expect(screen.getByText(/no qualifications/i)).toBeInTheDocument();
  });

  it("shows fresh matches immediately once typing after an Enter-forced no-results state produces a match", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "art" } });
    fireEvent.change(search, { target: { value: "ar" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.getByText(/no qualifications/i)).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "arc" } });

    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();
    expect(screen.queryByText(/no qualifications/i)).not.toBeInTheDocument();
  });

  it("does not freeze across a faculty switch, even when the current search term matches nothing there", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Commerce" } });
    expect(screen.getByText("Diploma in Fine Art")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(screen.getByText("Commerce Qualification 1")).toBeInTheDocument();
    expect(screen.queryByText("Diploma in Fine Art")).not.toBeInTheDocument();
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

  it("matches a title regardless of search-term word order", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "diploma education" } });
    expect(screen.getByText("Diploma in Education")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "education diploma" } });
    expect(screen.getByText("Diploma in Education")).toBeInTheDocument();
  });

  it("tolerates a minor spelling mistake in the search query", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "diploma eucation" } });

    expect(screen.getByText("Diploma in Education")).toBeInTheDocument();
  });

  it("expands degree abbreviations to match their spelled-out qualification titles", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");

    fireEvent.change(search, { target: { value: "phd" } });
    expect(screen.getByText("Doctor of Philosophy in Education")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "bsc" } });
    expect(screen.getByText("Bachelor of Science in Physics")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ba" } });
    expect(screen.getByText("Bachelor of Architecture")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "nd" } });
    expect(screen.getByText("National Diploma in Engineering")).toBeInTheDocument();
  });

  it("does not let an abbreviation query match an unrelated title with a stray matching character", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "phd" } });

    expect(screen.getByText("Doctor of Philosophy in Education")).toBeInTheDocument();
    expect(screen.queryByText("Diploma: 3-D Design and Digital Animation")).not.toBeInTheDocument();
  });

  it("keeps a fixed search placeholder regardless of which faculty is selected", () => {
    render(<QualificationsExplorer facultyGroups={GROUPS} initialFaculty="Arts" />);

    const search = screen.getByRole("searchbox");
    expect(search).toHaveAttribute("placeholder", "Search qualifications...");

    fireEvent.click(screen.getByRole("button", { name: /commerce/i }));

    expect(search).toHaveAttribute("placeholder", "Search qualifications...");
  });
});
