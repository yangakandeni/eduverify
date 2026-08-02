"use client";

import { POPULAR_CATEGORIES } from "@/lib/categories";

interface QualificationBrowserProps {
  activeCategory: string;
  onChange: (categoryKey: string) => void;
}

export default function QualificationBrowser({ activeCategory, onChange }: QualificationBrowserProps) {
  return (
    <nav id="browse" className="border-b border-border bg-card px-6 py-3 scroll-mt-14">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2.5 py-4">
        {POPULAR_CATEGORIES.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === pill.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
