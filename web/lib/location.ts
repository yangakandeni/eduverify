"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeProvince } from "./normalize";

/** Gauteng has the most registered institutions in our data, making it the least-wrong
 * guess for visitors we can't place — used whenever geolocation fails, times out, or
 * resolves outside South Africa. */
export const DEFAULT_PROVINCE = "Gauteng";

const GEO_ENDPOINT = "https://ipapi.co/json/";
const GEO_TIMEOUT_MS = 2500;

/**
 * Best-effort client-side IP geolocation for the "near me" default. The endpoint is a
 * free, unauthenticated API with no SLA, so any failure (network, timeout, rate limit,
 * a region outside SA) resolves to `null` rather than throwing — callers fall back to
 * DEFAULT_PROVINCE instead of surfacing an error.
 */
async function detectProvince(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

  try {
    const response = await fetch(GEO_ENDPOINT, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const province = normalizeProvince(data.region);
    return province === "Unknown" ? null : province;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface UserProvince {
  /** The active province — geolocated, then overridable by the user. */
  province: string;
  /** Lets the user override the detected/default province (e.g. from a dropdown). */
  setProvince: (province: string) => void;
  /** True until the geolocation attempt (success or failure) has resolved. */
  detecting: boolean;
}

/**
 * Resolves the province to show local results for. Starts at DEFAULT_PROVINCE, then
 * upgrades to the geolocated province if detection succeeds before the user picks one
 * manually — a manual pick always wins, so detection landing late never overwrites it.
 */
export function useUserProvince(): UserProvince {
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [detecting, setDetecting] = useState(true);
  const manuallySet = useRef(false);

  useEffect(() => {
    let cancelled = false;
    detectProvince().then((detected) => {
      if (cancelled) return;
      if (detected && !manuallySet.current) setProvince(detected);
      setDetecting(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    province,
    setProvince: (next: string) => {
      manuallySet.current = true;
      setProvince(next);
    },
    detecting,
  };
}
