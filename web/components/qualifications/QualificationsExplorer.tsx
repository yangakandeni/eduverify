"use client";

import { Search } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import BrowsePagination from "@/components/BrowsePagination";
import FacultySidebar from "@/components/qualifications/FacultySidebar";
import QualificationsGrid from "@/components/qualifications/QualificationsGrid";
import { normalizeText } from "@/lib/normalize";
import { ALL_QUALIFICATIONS_FACULTY, resolveInitialFaculty } from "@/lib/qualificationsData";
import { matchesQualificationSearch } from "@/lib/qualificationSearch";
import type { FacultyQualificationGroup, SaqaQualification } from "@/lib/types";

interface QualificationsExplorerProps {
  facultyGroups: FacultyQualificationGroup[];
  initialFaculty?: string;
  initialSearchTerm?: string;
}

const ITEMS_PER_PAGE = 12;

function filterQualifications(qualifications: SaqaQualification[], query: string): SaqaQualification[] {
  const normalized = normalizeText(query);
  if (!normalized) return qualifications;
  return qualifications.filter(
    (qualification) => matchesQualificationSearch(qualification.title, query) || String(qualification.qualId).includes(normalized),
  );
}

function resolveActiveGroup(
  facultyGroups: FacultyQualificationGroup[],
  allQualifications: SaqaQualification[],
  faculty: string,
): FacultyQualificationGroup {
  if (faculty === ALL_QUALIFICATIONS_FACULTY) {
    return { faculty: ALL_QUALIFICATIONS_FACULTY, count: allQualifications.length, qualifications: allQualifications };
  }
  return facultyGroups.find((group) => group.faculty === faculty) ?? facultyGroups[0];
}

export default function QualificationsExplorer({ facultyGroups, initialFaculty, initialSearchTerm }: QualificationsExplorerProps) {
  const [selectedFaculty, setSelectedFaculty] = useState(
    () => resolveInitialFaculty(facultyGroups, initialFaculty) ?? facultyGroups[0].faculty,
  );
  const [searchQuery, setSearchQuery] = useState(initialSearchTerm ?? "");
  const [appliedQuery, setAppliedQuery] = useState(initialSearchTerm ?? "");
  const [currentPage, setCurrentPage] = useState(1);

  const allQualifications = useMemo(() => facultyGroups.flatMap((group) => group.qualifications), [facultyGroups]);

  const activeGroup = resolveActiveGroup(facultyGroups, allQualifications, selectedFaculty);

  // Freezes on the last non-empty result set while the user types, rather than flashing to an
  // empty grid on every keystroke that doesn't (yet) match anything — see plan for rationale.
  const [displayedQualifications, setDisplayedQualifications] = useState(() =>
    filterQualifications(activeGroup.qualifications, initialSearchTerm ?? ""),
  );

  const totalPages = Math.max(1, Math.ceil(displayedQualifications.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = displayedQualifications.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function handleSelectFaculty(faculty: string) {
    setSelectedFaculty(faculty);
    setCurrentPage(1);
    const nextGroup = resolveActiveGroup(facultyGroups, allQualifications, faculty);
    setDisplayedQualifications(filterQualifications(nextGroup.qualifications, searchQuery));
    setAppliedQuery(searchQuery);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
    const candidate = filterQualifications(activeGroup.qualifications, value);
    if (candidate.length > 0) {
      setDisplayedQualifications(candidate);
      setAppliedQuery(value);
    }
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    setCurrentPage(1);
    setDisplayedQualifications(filterQualifications(activeGroup.qualifications, searchQuery));
    setAppliedQuery(searchQuery);
  }

  function handleGoToPage(target: number) {
    setCurrentPage(Math.min(Math.max(target, 1), totalPages));
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <aside className="md:w-64 md:flex-shrink-0">
        <FacultySidebar
          faculties={[
            { faculty: ALL_QUALIFICATIONS_FACULTY, count: allQualifications.length },
            ...facultyGroups.map(({ faculty, count }) => ({ faculty, count })),
          ]}
          selectedFaculty={selectedFaculty}
          onSelect={handleSelectFaculty}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="relative w-full sm:max-w-sm sm:self-end">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search qualifications..."
            aria-label="Search qualifications"
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        {appliedQuery.trim() && (
          <p className="font-display text-base font-semibold text-foreground">Results for &quot;{appliedQuery}&quot;</p>
        )}
        <QualificationsGrid
          qualifications={pageItems}
          searchTerm={appliedQuery.trim() || undefined}
          facultyName={selectedFaculty !== ALL_QUALIFICATIONS_FACULTY ? selectedFaculty : undefined}
        />
        <BrowsePagination page={page} totalPages={totalPages} onGoToPage={handleGoToPage} />
      </div>
    </div>
  );
}
