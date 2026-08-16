import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import type { FacultyGroup } from "@/lib/types";

const FACULTIES: FacultyGroup[] = [
  { faculty: "Music", count: 3 },
  { faculty: "Visual Arts", count: 2 },
];

describe("FacultySidebar", () => {
  it("renders an 'All Faculties' entry plus one link per faculty, each showing its count", () => {
    render(<FacultySidebar institutionId="stellenbosch" faculties={FACULTIES} />);

    expect(screen.getByRole("link", { name: /all faculties/i })).toHaveAttribute(
      "href",
      "/institutions/stellenbosch/qualifications",
    );

    const music = screen.getByRole("link", { name: /music/i });
    expect(music).toHaveAttribute("href", "/institutions/stellenbosch/qualifications?faculty=Music");
    expect(screen.getByText("3")).toBeInTheDocument();

    const visualArts = screen.getByRole("link", { name: /visual arts/i });
    expect(visualArts).toHaveAttribute("href", "/institutions/stellenbosch/qualifications?faculty=Visual+Arts");
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("marks 'All Faculties' as active when no faculty is selected", () => {
    render(<FacultySidebar institutionId="stellenbosch" faculties={FACULTIES} />);

    expect(screen.getByRole("link", { name: /all faculties/i })).toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: /music/i })).not.toHaveClass("bg-primary");
  });

  it("marks the selected faculty as active", () => {
    render(<FacultySidebar institutionId="stellenbosch" faculties={FACULTIES} activeFaculty="Music" />);

    expect(screen.getByRole("link", { name: /music/i })).toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: /all faculties/i })).not.toHaveClass("bg-primary");
  });

  it("URL-encodes faculty names containing special characters", () => {
    render(
      <FacultySidebar
        institutionId="ufs"
        faculties={[{ faculty: "Hospitality, Tourism, Travel, Gaming and Leisure", count: 1 }]}
      />,
    );

    const link = screen.getByRole("link", { name: /hospitality/i });
    expect(link).toHaveAttribute(
      "href",
      "/institutions/ufs/qualifications?faculty=Hospitality%2C+Tourism%2C+Travel%2C+Gaming+and+Leisure",
    );
  });
});
