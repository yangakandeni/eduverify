"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { SavedInstitution } from "./dashboardData";

const SAVED_KEY = "eduverify:saved";

/** One-time snapshot read, not a subscription — a lazy initializer avoids the
 * SSR-only render entirely re-running via an effect (and reads correctly again once
 * this client component mounts and hydrates in the browser). */
function readLocalSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalSavedIds(ids: Set<string>) {
  window.localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

/** Shared across every surface that lets a user save/unsave an institution. Signed-in
 * users persist to their Clerk account (via /api/saved-institutions) so a save follows
 * them across devices; signed-out visitors fall back to a local, anonymous set. */
export function useSavedInstitutions(): [Set<string>, (id: string) => void] {
  const { isSignedIn, isLoaded } = useUser();
  const [savedIds, setSavedIds] = useState<Set<string>>(readLocalSavedIds);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    fetch("/api/saved-institutions")
      .then((response) => (response.ok ? response.json() : { saved: [] as SavedInstitution[] }))
      .then(({ saved }: { saved: SavedInstitution[] }) => {
        if (!cancelled) setSavedIds(new Set(saved.map((entry) => entry.institutionId)));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) writeLocalSavedIds(savedIds);
  }, [savedIds, isSignedIn]);

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      const wasSaved = next.has(id);
      if (wasSaved) next.delete(id);
      else next.add(id);

      if (isSignedIn) {
        fetch("/api/saved-institutions", {
          method: wasSaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ institutionId: id }),
        }).catch(() => {});
      }

      return next;
    });
  }

  return [savedIds, toggleSaved];
}
