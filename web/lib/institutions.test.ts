import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as localData from "./localData";
import * as search from "./search";
import * as apiClient from "./apiClient";
import { getAllInstitutions, getInstitution, searchInstitutions } from "./institutions";
import type { InstitutionRecord } from "./types";

vi.mock("./localData", () => ({
  ALL_INSTITUTIONS: [
    {
      id: "LOCAL#1",
      name: "Bundled Local Institution",
      address: "",
      contacts: { email: [], phone: [] },
      institutionType: "Private Higher Education Institution",
      faculties_and_programmes: [],
    },
  ],
  findLocalById: vi.fn(),
}));

vi.mock("./search", () => ({
  searchLocal: vi.fn(),
}));

vi.mock("./apiClient", () => ({
  getJson: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
}));

function makeInstitution(overrides: Partial<InstitutionRecord> = {}): InstitutionRecord {
  return {
    id: "INST#1",
    name: "Fixture Institution",
    address: "",
    contacts: { email: [], phone: [] },
    institutionType: "Private Higher Education Institution",
    faculties_and_programmes: [],
    ...overrides,
  };
}

describe("institutions", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(localData.findLocalById).mockReset();
    vi.mocked(search.searchLocal).mockReset().mockReturnValue([]);
    vi.mocked(apiClient.getJson).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("local fallback path (USE_EXTERNAL_API unset)", () => {
    describe("getInstitution", () => {
      it("returns the local hit when found", async () => {
        const localInstitution = makeInstitution({ id: "INST#2" });
        vi.mocked(localData.findLocalById).mockReturnValue(localInstitution);

        const result = await getInstitution("INST#2");

        expect(result).toEqual(localInstitution);
      });

      it("returns null when there's no local match", async () => {
        vi.mocked(localData.findLocalById).mockReturnValue(undefined);

        const result = await getInstitution("INST#missing");

        expect(result).toBeNull();
      });
    });

    describe("searchInstitutions", () => {
      it("returns an empty, not-not-found result for a blank query", async () => {
        const result = await searchInstitutions("   ");
        expect(result).toEqual({ results: [], notFound: false });
      });

      it("returns local fuzzy-search hits", async () => {
        const localOnly = makeInstitution({ id: "INST#local" });
        vi.mocked(search.searchLocal).mockReturnValue([localOnly]);

        const result = await searchInstitutions("fixture");

        expect(result).toEqual({ results: [localOnly], notFound: false });
      });

      it("reports notFound when local search has no hits", async () => {
        vi.mocked(search.searchLocal).mockReturnValue([]);

        const result = await searchInstitutions("fixture");

        expect(result).toEqual({ results: [], notFound: true });
      });
    });
  });

  describe("external API path (USE_EXTERNAL_API=true)", () => {
    beforeEach(() => {
      vi.stubEnv("USE_EXTERNAL_API", "true");
    });

    describe("getInstitution", () => {
      it("fetches the institution from the API and unwraps the { institution } envelope", async () => {
        const institution = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ institution });

        const result = await getInstitution("INST#1");

        expect(result).toEqual(institution);
        expect(apiClient.getJson).toHaveBeenCalledWith(expect.stringContaining("/v1/institutions/INST%231"));
        expect(localData.findLocalById).not.toHaveBeenCalled();
      });

      it("returns null for a 404 (apiClient's getJson already maps this to null)", async () => {
        vi.mocked(apiClient.getJson).mockResolvedValue(null);

        const result = await getInstitution("INST#missing");

        expect(result).toBeNull();
        expect(localData.findLocalById).not.toHaveBeenCalled();
      });

      it("propagates an API error instead of degrading to local data", async () => {
        const { ApiError } = apiClient;
        vi.mocked(apiClient.getJson).mockRejectedValue(new ApiError(503, "service unavailable"));

        await expect(getInstitution("INST#1")).rejects.toMatchObject({ status: 503 });
        expect(localData.findLocalById).not.toHaveBeenCalled();
      });

      it("defaults faculties_and_programmes to [] when the API response omits it (bake gap)", async () => {
        const { faculties_and_programmes, ...institutionWithoutFaculties } = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ institution: institutionWithoutFaculties });

        const result = await getInstitution("INST#1");

        expect(result?.faculties_and_programmes).toEqual([]);
      });
    });

    describe("searchInstitutions", () => {
      it("returns an empty, not-not-found result for a blank query without calling the API", async () => {
        const result = await searchInstitutions("   ");

        expect(result).toEqual({ results: [], notFound: false });
        expect(apiClient.getJson).not.toHaveBeenCalled();
      });

      it("fetches results from the API and unwraps the { query, results } envelope", async () => {
        const institution = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ query: "fixture", results: [institution] });

        const result = await searchInstitutions("fixture", { province: "Gauteng" });

        expect(result).toEqual({ results: [institution], notFound: false });
        const [path] = vi.mocked(apiClient.getJson).mock.calls[0];
        expect(path).toContain("/v1/institutions/search?");
        expect(path).toContain("q=fixture");
        expect(path).toContain("province=Gauteng");
        expect(search.searchLocal).not.toHaveBeenCalled();
      });

      it("propagates an API error instead of degrading to local search", async () => {
        const { ApiError } = apiClient;
        vi.mocked(apiClient.getJson).mockRejectedValue(new ApiError(500, "internal error"));

        await expect(searchInstitutions("fixture")).rejects.toMatchObject({ status: 500 });
        expect(search.searchLocal).not.toHaveBeenCalled();
      });

      it("defaults faculties_and_programmes to [] when the API response omits it (bake gap)", async () => {
        const { faculties_and_programmes, ...institutionWithoutFaculties } = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ query: "fixture", results: [institutionWithoutFaculties] });

        const result = await searchInstitutions("fixture");

        expect(result.results[0].faculties_and_programmes).toEqual([]);
      });
    });
  });

  describe("getAllInstitutions", () => {
    it("local fallback path: returns the bundled ALL_INSTITUTIONS array unchanged", async () => {
      const result = await getAllInstitutions();
      expect(result).toEqual(localData.ALL_INSTITUTIONS);
      expect(apiClient.getJson).not.toHaveBeenCalled();
    });

    describe("external API path (USE_EXTERNAL_API=true)", () => {
      beforeEach(() => {
        vi.stubEnv("USE_EXTERNAL_API", "true");
      });

      it("fetches every status via status=ALL and a large pageSize, unwrapping { institutions }", async () => {
        const institution = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ institutions: [institution], page: 1, pageSize: 1000, total: 1 });

        const result = await getAllInstitutions();

        expect(result).toEqual([institution]);
        const [path] = vi.mocked(apiClient.getJson).mock.calls[0];
        expect(path).toContain("/v1/institutions/list?");
        expect(path).toContain("status=ALL");
      });

      it("requests fields=full — the homepage needs every SAQA-matched programme row up front (qualification search, faculty pills), unlike the default summary shape", async () => {
        vi.mocked(apiClient.getJson).mockResolvedValue({ institutions: [], page: 1, pageSize: 1000, total: 0 });

        await getAllInstitutions();

        const [path] = vi.mocked(apiClient.getJson).mock.calls[0];
        expect(path).toContain("fields=full");
      });

      it("propagates an API error instead of degrading to bundled local data", async () => {
        const { ApiError } = apiClient;
        vi.mocked(apiClient.getJson).mockRejectedValue(new ApiError(503, "service unavailable"));

        await expect(getAllInstitutions()).rejects.toMatchObject({ status: 503 });
      });

      it("defaults faculties_and_programmes to [] when the API response omits it (bake gap)", async () => {
        const { faculties_and_programmes, ...institutionWithoutFaculties } = makeInstitution();
        vi.mocked(apiClient.getJson).mockResolvedValue({ institutions: [institutionWithoutFaculties], page: 1, pageSize: 1000, total: 1 });

        const result = await getAllInstitutions();

        expect(result[0].faculties_and_programmes).toEqual([]);
      });
    });
  });
});
