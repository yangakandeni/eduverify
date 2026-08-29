"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { SavedInstitution } from "./dashboardData";

const SAVED_KEY = "eduverify:saved";

function readLocalSavedIds(): Set<string> {
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
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  // Starts empty (matching the server-rendered markup) and reconciles with
  // localStorage only after mount, so the client's first paint never diverges
  // from what was already sent down as HTML — reading it as part of the
  // initial state instead caused a hydration mismatch.
  useEffect(() => {
    // A lazy useState initializer would run on the server too (no window) and
    // reintroduce the hydration mismatch the comment above describes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate, see above
    setSavedIds(readLocalSavedIds());
  }, []);

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
      } else {
        writeLocalSavedIds(next);
      }

      return next;
    });
  }

  return [savedIds, toggleSaved];
}
