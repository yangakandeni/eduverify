import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import type { FacultyGroup } from "@/lib/types";

const FACULTIES: FacultyGroup[] = [
  { faculty: "Music", count: 3 },
  { faculty: "Visual Arts", count: 2 },
];

describe("FacultySidebar", () => {
  it("renders one button per faculty, with no 'All Faculties' entry", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /all faculties/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(FACULTIES.length);
  });

  it("shows each faculty's count", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked faculty's name", () => {
    const onSelect = vi.fn();
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /visual arts/i }));

    expect(onSelect).toHaveBeenCalledWith("Visual Arts");
  });

  it("marks the selected faculty's button as pressed and styles it distinctly", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    const music = screen.getByRole("button", { name: /music/i });
    const visualArts = screen.getByRole("button", { name: /visual arts/i });

    expect(music).toHaveAttribute("aria-pressed", "true");
    expect(music).toHaveClass("bg-primary");
    expect(visualArts).toHaveAttribute("aria-pressed", "false");
    expect(visualArts).not.toHaveClass("bg-primary");
  });

  it("does not render a 'Qualifications & Faculties' header, since the faculty list already implies it", () => {
    render(<FacultySidebar faculties={FACULTIES} selectedFaculty="Music" onSelect={vi.fn()} />);

    expect(screen.queryByText(/qualifications & faculties/i)).not.toBeInTheDocument();
  });
});
