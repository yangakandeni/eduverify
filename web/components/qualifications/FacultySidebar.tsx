"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FacultyGroup } from "@/lib/types";

interface FacultySidebarProps {
  faculties: FacultyGroup[];
  selectedFaculty: string;
  onSelect: (faculty: string) => void;
}

const BUTTON_CLASS = "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
const ACTIVE_CLASS = "bg-primary text-white";
const INACTIVE_CLASS = "text-muted-foreground hover:bg-secondary hover:text-foreground";
const COUNT_CLASS = "rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold";
const INACTIVE_COUNT_CLASS = "rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground";

export default function FacultySidebar({ faculties, selectedFaculty, onSelect }: FacultySidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const activeFaculty = faculties.find(({ faculty }) => faculty === selectedFaculty) ?? faculties[0];

  function handleSelect(faculty: string) {
    onSelect(faculty);
    setExpanded(false);
  }

  return (
    <div className="md:sticky md:top-24 md:flex md:max-h-[calc(100vh-8rem)] md:flex-col md:gap-3 md:overflow-y-auto md:pr-1">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls="faculty-panel"
        aria-label="Toggle faculty filter"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left text-sm font-semibold text-foreground md:hidden"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {activeFaculty.faculty}
          <span className={INACTIVE_COUNT_CLASS}>{activeFaculty.count}</span>
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <nav
        id="faculty-panel"
        aria-label="Faculties"
        className={`flex-col gap-1 md:flex ${expanded ? "mt-2 flex" : "hidden"}`}
      >
        {faculties.map(({ faculty, count }) => {
          const active = selectedFaculty === faculty;
          return (
            <button
              key={faculty}
              type="button"
              onClick={() => handleSelect(faculty)}
              aria-pressed={active}
              className={`${BUTTON_CLASS} ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
            >
              {faculty}
              <span className={active ? COUNT_CLASS : INACTIVE_COUNT_CLASS}>{count}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
