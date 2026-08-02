"use client";

import { Filter, LayoutGrid, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PRIMARY_CATEGORY_KEYS, QUALIFICATION_CATEGORIES } from "@/lib/categories";
import Modal from "@/components/ui/Modal";

interface QualificationBrowserProps {
  activeCategory: string;
  onChange: (categoryKey: string) => void;
}

const PRIMARY_PILLS = [
  { key: "all", label: "All" },
  ...PRIMARY_CATEGORY_KEYS.map((key) => ({
    key,
    label: QUALIFICATION_CATEGORIES.find((category) => category.key === key)?.label ?? key,
  })),
];

export default function QualificationBrowser({ activeCategory, onChange }: QualificationBrowserProps) {
  const [browseAllOpen, setBrowseAllOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = modalQuery.trim().toLowerCase();
    if (!q) return QUALIFICATION_CATEGORIES;
    return QUALIFICATION_CATEGORIES.filter((category) => category.label.toLowerCase().includes(q));
  }, [modalQuery]);

  return (
    <nav id="browse" className="border-b border-border bg-card px-6 py-3 scroll-mt-14">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto pb-1">
        <span className="hidden flex-shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground sm:inline-flex">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        {PRIMARY_PILLS.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === pill.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {pill.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setBrowseAllOpen(true)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse All...
        </button>
      </div>

      <Modal open={browseAllOpen} onClose={() => setBrowseAllOpen(false)} title="Browse qualification fields" widthClassName="max-w-xl">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            value={modalQuery}
            onChange={(event) => setModalQuery(event.target.value)}
            placeholder="Search qualification fields..."
            className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/40"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setBrowseAllOpen(false);
            }}
            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
              activeCategory === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/30 hover:bg-secondary"
            }`}
          >
            All qualification fields
          </button>
          {filteredCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                onChange(category.key);
                setBrowseAllOpen(false);
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                activeCategory === category.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary/30 hover:bg-secondary"
              }`}
            >
              {category.label}
            </button>
          ))}
          {filteredCategories.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              No qualification fields match &quot;{modalQuery}&quot;.
            </p>
          )}
        </div>
      </Modal>
    </nav>
  );
}
