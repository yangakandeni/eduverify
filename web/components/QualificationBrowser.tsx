"use client";

import { LayoutGrid, Search } from "lucide-react";
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
    <nav className="border-b border-slate-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto pb-1">
        {PRIMARY_PILLS.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === pill.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {pill.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setBrowseAllOpen(true)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse All...
        </button>
      </div>

      <Modal open={browseAllOpen} onClose={() => setBrowseAllOpen(false)} title="Browse qualification fields" widthClassName="max-w-xl">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={modalQuery}
            onChange={(event) => setModalQuery(event.target.value)}
            placeholder="Search qualification fields..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
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
              activeCategory === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
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
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {category.label}
            </button>
          ))}
          {filteredCategories.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-400">
              No qualification fields match &quot;{modalQuery}&quot;.
            </p>
          )}
        </div>
      </Modal>
    </nav>
  );
}
