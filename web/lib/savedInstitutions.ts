"use client";

import { useEffect, useState } from "react";

const SAVED_KEY = "eduverify:saved";

/** One-time snapshot read, not a subscription — a lazy initializer avoids the
 * SSR-only render entirely re-running via an effect (and reads correctly again once
 * this client component mounts and hydrates in the browser). */
function readSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Shared across every surface that lets a user save/unsave an institution, so they
 * all read and write the same localStorage set instead of drifting independently. */
export function useSavedInstitutions(): [Set<string>, (id: string) => void] {
  const [savedIds, setSavedIds] = useState<Set<string>>(readSavedIds);

  useEffect(() => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds]));
  }, [savedIds]);

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return [savedIds, toggleSaved];
}
