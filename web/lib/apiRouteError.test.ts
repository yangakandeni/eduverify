import { describe, expect, it } from "vitest";
import { ApiError } from "./apiClient";
import { toServiceUnavailableResponse } from "./apiRouteError";

describe("toServiceUnavailableResponse", () => {
  it("maps an ApiError to a 503 with a stable service_unavailable body", async () => {
    const response = toServiceUnavailableResponse(new ApiError(500, "internal error"));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("service_unavailable");
    expect(typeof body.message).toBe("string");
  });

  it("maps a timed-out ApiError (status 0) to the same 503 shape", async () => {
    const response = toServiceUnavailableResponse(new ApiError(0, "timed out"));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("service_unavailable");
  });

  it("rethrows anything that isn't an ApiError, so real bugs aren't masked as an outage", () => {
    expect(() => toServiceUnavailableResponse(new TypeError("boom"))).toThrow(TypeError);
    expect(() => toServiceUnavailableResponse("not even an error")).toThrow();
  });
});
