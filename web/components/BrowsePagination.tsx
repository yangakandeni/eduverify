"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildPageList } from "@/lib/pagination";

interface BrowsePaginationProps {
  page: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
}

export default function BrowsePagination({ page, totalPages, onGoToPage }: BrowsePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onGoToPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {buildPageList(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onGoToPage(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition ${
              entry === page
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground hover:bg-secondary"
            }`}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onGoToPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
