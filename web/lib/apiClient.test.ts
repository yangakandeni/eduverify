import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function freshApiClient() {
  vi.resetModules();
  return import("./apiClient");
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubEnv("EDUVERIFY_API_BASE_URL", "https://api.eduverify.example");
    vi.stubEnv("EDUVERIFY_API_KEY", "test-key-123");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("getJson", () => {
    it("requests the base URL joined with the path", async () => {
      const { getJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      await getJson("/v1/institutions/abc");

      expect(fetch).toHaveBeenCalledWith(
        "https://api.eduverify.example/v1/institutions/abc",
        expect.objectContaining({ headers: expect.objectContaining({ "x-api-key": "test-key-123" }) })
      );
    });

    it("sends the configured API key as the x-api-key header", async () => {
      const { getJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      await getJson("/v1/health");

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("test-key-123");
    });

    it("resolves with the parsed JSON body on a 200 response", async () => {
      const { getJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: "INST#1" }), { status: 200 }));

      const result = await getJson("/v1/institutions/INST%231");

      expect(result).toEqual({ id: "INST#1" });
    });

    it("maps a 404 response to null", async () => {
      const { getJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "not found" }), { status: 404 }));

      const result = await getJson("/v1/institutions/does-not-exist");

      expect(result).toBeNull();
    });

    it("propagates a 5xx response as a thrown ApiError carrying the status", async () => {
      const { getJson, ApiError } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "boom" }), { status: 503 }));

      await expect(getJson("/v1/institutions/abc")).rejects.toBeInstanceOf(ApiError);
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));
      await expect(getJson("/v1/institutions/abc")).rejects.toMatchObject({ status: 500 });
    });

    it("aborts and throws an ApiError when the request exceeds the timeout", async () => {
      vi.useFakeTimers();
      const { getJson } = await freshApiClient();
      vi.mocked(fetch).mockImplementation((_url, init) => {
        const signal = (init as RequestInit)?.signal;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => {
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      });

      const pending = getJson("/v1/institutions/slow");
      const assertion = expect(pending).rejects.toMatchObject({ status: 0 });
      await vi.runAllTimersAsync();
      await assertion;
    });
  });

  describe("postJson", () => {
    it("sends a POST with a JSON-encoded body and Content-Type header", async () => {
      const { postJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ matched: true }), { status: 200 }));

      await postJson("/v1/institutions/verify", { name: "UCT" });

      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ name: "UCT" }));
      const headers = init?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["x-api-key"]).toBe("test-key-123");
    });

    it("resolves with the parsed JSON response", async () => {
      const { postJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ matched: true }), { status: 200 }));

      const result = await postJson("/v1/institutions/verify", { name: "UCT" });

      expect(result).toEqual({ matched: true });
    });

    it("propagates any non-ok response as an ApiError, with no 404-to-null mapping", async () => {
      const { postJson } = await freshApiClient();
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 404 }));

      await expect(postJson("/v1/institutions/verify", {})).rejects.toMatchObject({ status: 404 });
    });
  });
});
