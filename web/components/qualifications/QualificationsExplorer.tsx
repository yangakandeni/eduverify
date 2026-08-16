"use client";

import { useMemo, useState } from "react";
import BrowsePagination from "@/components/BrowsePagination";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import QualificationsGrid from "@/components/qualifications/QualificationsGrid";
import { normalizeText } from "@/lib/normalize";
import { resolveInitialFaculty } from "@/lib/qualificationsData";
import type { FacultyQualificationGroup } from "@/lib/types";

interface QualificationsExplorerProps {
  facultyGroups: FacultyQualificationGroup[];
  initialFaculty?: string;
  brandColor: string;
}

const ITEMS_PER_PAGE = 12;

export default function QualificationsExplorer({ facultyGroups, initialFaculty, brandColor }: QualificationsExplorerProps) {
  const [selectedFaculty, setSelectedFaculty] = useState(
    () => resolveInitialFaculty(facultyGroups, initialFaculty) ?? facultyGroups[0].faculty,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activeGroup = facultyGroups.find((group) => group.faculty === selectedFaculty) ?? facultyGroups[0];

  const filteredQualifications = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query) return activeGroup.qualifications;
    return activeGroup.qualifications.filter(
      (qualification) =>
        normalizeText(qualification.title).includes(query) || String(qualification.qualId).includes(query),
    );
  }, [activeGroup, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredQualifications.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filteredQualifications.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function handleSelectFaculty(faculty: string) {
    setSelectedFaculty(faculty);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleGoToPage(target: number) {
    setCurrentPage(Math.min(Math.max(target, 1), totalPages));
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <aside className="md:w-64 md:flex-shrink-0">
        <FacultySidebar
          faculties={facultyGroups.map(({ faculty, count }) => ({ faculty, count }))}
          selectedFaculty={selectedFaculty}
          onSelect={handleSelectFaculty}
          brandColor={brandColor}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={`Search ${selectedFaculty} qualifications...`}
          aria-label={`Search ${selectedFaculty} qualifications`}
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <QualificationsGrid qualifications={pageItems} />
        <BrowsePagination page={page} totalPages={totalPages} onGoToPage={handleGoToPage} />
      </div>
    </div>
  );
}
