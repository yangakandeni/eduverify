import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import type { FacultyGroup } from "@/lib/types";

const FACULTIES: FacultyGroup[] = [
  { faculty: "Music", count: 3 },
  { faculty: "Visual Arts", count: 2 },
];

function nav() {
  return screen.getByRole("navigation", { name: /faculties/i });
}

describe("FacultySidebar", () => {
  it("renders one button per faculty in the faculty list, with no 'All Faculties' entry", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(within(nav()).queryByRole("button", { name: /all faculties/i })).not.toBeInTheDocument();
    expect(within(nav()).getAllByRole("button")).toHaveLength(FACULTIES.length);
  });

  it("shows each faculty's count", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(within(nav()).getByText("3")).toBeInTheDocument();
    expect(within(nav()).getByText("2")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked faculty's name", () => {
    const onSelect = vi.fn();
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={onSelect} />);

    fireEvent.click(within(nav()).getByRole("button", { name: /visual arts/i }));

    expect(onSelect).toHaveBeenCalledWith("Visual Arts");
  });

  it("marks the selected faculty's button as pressed and styles it distinctly", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    const music = within(nav()).getByRole("button", { name: /music/i });
    const visualArts = within(nav()).getByRole("button", { name: /visual arts/i });

    expect(music).toHaveAttribute("aria-pressed", "true");
    expect(music).toHaveClass("bg-primary");
    expect(visualArts).toHaveAttribute("aria-pressed", "false");
    expect(visualArts).not.toHaveClass("bg-primary");
  });

  it("does not render a 'Qualifications & Faculties' header, since the faculty list already implies it", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(screen.queryByText(/qualifications & faculties/i)).not.toBeInTheDocument();
  });

  describe("mobile accordion trigger", () => {
    function trigger() {
      return screen.getByRole("button", { name: /toggle faculty filter/i });
    }

    it("is collapsed by default, hiding the faculty list", () => {
      render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(nav()).toHaveClass("hidden");
    });

    it("shows the active faculty's name next to the trigger", () => {
      render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Visual Arts" onSelect={vi.fn()} />);

      expect(within(trigger()).getByText("Visual Arts")).toBeInTheDocument();
    });

    it("expands the faculty list on click", () => {
      render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

      fireEvent.click(trigger());

      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(nav()).not.toHaveClass("hidden");
    });

    it("collapses the list again once a faculty is selected", () => {
      const onSelect = vi.fn();
      render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={onSelect} />);

      fireEvent.click(trigger());
      fireEvent.click(within(nav()).getByRole("button", { name: /visual arts/i }));

      expect(onSelect).toHaveBeenCalledWith("Visual Arts");
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(nav()).toHaveClass("hidden");
    });
  });
});
