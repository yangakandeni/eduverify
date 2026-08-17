import { NextResponse } from "next/server";
import { ApiError } from "./apiClient";

/** Shared shape every route returns for this one failure mode, so client code (e.g.
 * HomeClient's search) can check a single field rather than re-deriving "is this an
 * outage" from a raw status code. */
export interface ServiceUnavailableBody {
  error: "service_unavailable";
  message: string;
}

/** Maps an eduverify-api outage (any ApiError — 5xx, timeout, network) to a consistent
 * 503 JSON response every route handler returns the same way. Rethrows anything else —
 * only this specific, designed-for failure mode (there's no local fallback left post-cutover)
 * should read as "service temporarily unavailable" rather than a genuine application bug
 * Next.js's own error handling should still surface. */
export function toServiceUnavailableResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: "service_unavailable", message: "The verification service is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
  throw error;
}
