"use client";

import type { FacultyGroup } from "@/lib/types";

interface FacultySidebarProps {
  faculties: FacultyGroup[];
  selectedFaculty: string;
  onSelect: (faculty: string) => void;
  brandColor: string;
}

const BUTTON_CLASS = "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
const ACTIVE_CLASS = "bg-primary text-white";
const INACTIVE_CLASS = "text-muted-foreground hover:bg-secondary hover:text-foreground";
const COUNT_CLASS = "rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold";
const INACTIVE_COUNT_CLASS = "rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground";

export default function FacultySidebar({ faculties, selectedFaculty, onSelect, brandColor }: FacultySidebarProps) {
  return (
    <div className="sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pr-1">
      <h2 style={{ color: brandColor }} className="font-display text-sm font-semibold uppercase tracking-wide">
        Qualifications &amp; Faculties
      </h2>
      <nav aria-label="Faculties" className="flex flex-col gap-1">
        {faculties.map(({ faculty, count }) => {
          const active = selectedFaculty === faculty;
          return (
            <button
              key={faculty}
              type="button"
              onClick={() => onSelect(faculty)}
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
