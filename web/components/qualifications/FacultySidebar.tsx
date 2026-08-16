import Link from "next/link";
import type { FacultyGroup } from "@/lib/types";

interface FacultySidebarProps {
  institutionId: string;
  faculties: FacultyGroup[];
  activeFaculty?: string;
}

const LINK_CLASS =
  "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
const ACTIVE_CLASS = "bg-primary text-white";
const INACTIVE_CLASS = "text-muted-foreground hover:bg-secondary hover:text-foreground";
const COUNT_CLASS = "rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold";
const INACTIVE_COUNT_CLASS = "rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground";

export default function FacultySidebar({ institutionId, faculties, activeFaculty }: FacultySidebarProps) {
  const basePath = `/institutions/${encodeURIComponent(institutionId)}/qualifications`;
  const totalCount = faculties.reduce((sum, faculty) => sum + faculty.count, 0);

  return (
    <nav aria-label="Faculties" className="flex flex-col gap-1">
      <Link href={basePath} className={`${LINK_CLASS} ${!activeFaculty ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
        All Faculties
        <span className={!activeFaculty ? COUNT_CLASS : INACTIVE_COUNT_CLASS}>{totalCount}</span>
      </Link>
      {faculties.map(({ faculty, count }) => {
        const active = activeFaculty === faculty;
        const href = `${basePath}?${new URLSearchParams({ faculty }).toString()}`;
        return (
          <Link key={faculty} href={href} className={`${LINK_CLASS} ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
            {faculty}
            <span className={active ? COUNT_CLASS : INACTIVE_COUNT_CLASS}>{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
