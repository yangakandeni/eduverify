"use client";

import { Bookmark, MapPin } from "lucide-react";
import { useState } from "react";
import InstitutionDetailModal from "@/components/InstitutionDetailModal";
import Modal from "@/components/ui/Modal";
import type { SavedInstitutionRecord } from "@/lib/dashboardData";
import { TYPE_LABEL, getBrandColor, getDisplayName, getInitials, getPrimaryLocation, getStatusBadge } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

interface SavedInstitutionsListProps {
  records: SavedInstitutionRecord[];
}

export default function SavedInstitutionsList({ records }: SavedInstitutionsListProps) {
  const [items, setItems] = useState(records);
  const [viewing, setViewing] = useState<InstitutionRecord | null>(null);

  async function handleUnsave(institutionId: string) {
    setItems((current) => current.filter((item) => item.institution.id !== institutionId));

    try {
      await fetch("/api/saved-institutions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId }),
      });
    } catch {
      // best-effort; a failed unsave just reappears on the next dashboard load
    }
  }

  if (items.length === 0) return null;

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(({ institution }) => {
          const badge = getStatusBadge(institution);
          const location = getPrimaryLocation(institution);
          return (
            <li key={institution.id} className="flex flex-col rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
                    style={{ backgroundColor: getBrandColor(institution) }}
                  >
                    {getInitials(institution.name)}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setViewing(institution)}
                      className="line-clamp-2 text-left font-display text-sm font-semibold text-foreground hover:text-accent"
                    >
                      {getDisplayName(institution.name, institution.tradingName)}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABEL[institution.institutionType] ?? institution.institutionType}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnsave(institution.id)}
                  aria-label="Remove from saved"
                  className="rounded-full p-1.5 text-foreground transition hover:text-muted-foreground"
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </button>
              </div>

              {location && (
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </span>
                </div>
              )}

              <span
                className={`mt-2 inline-flex w-fit items-center rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                  badge.cancelled ? "bg-rose-50 text-rose-700" : badge.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {badge.label}
              </span>
            </li>
          );
        })}
      </ul>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? "Institution"}
        widthClassName="max-w-2xl"
        hideHeader
      >
        {viewing && <InstitutionDetailModal institution={viewing} onClose={() => setViewing(null)} />}
      </Modal>
    </>
  );
}
