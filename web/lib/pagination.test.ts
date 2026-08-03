import { describe, expect, it } from "vitest";
import { buildPageList } from "./pagination";

describe("buildPageList", () => {
  it("lists every page when the total fits without ellipsis", () => {
    expect(buildPageList(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns a single page when there is only one", () => {
    expect(buildPageList(1, 1)).toEqual([1]);
  });

  it("windows around the current page with a trailing ellipsis", () => {
    expect(buildPageList(1, 33)).toEqual([1, 2, "ellipsis", 33]);
  });

  it("windows around the current page with a leading ellipsis", () => {
    expect(buildPageList(33, 33)).toEqual([1, "ellipsis", 32, 33]);
  });

  it("windows around a middle page with ellipsis on both sides", () => {
    expect(buildPageList(17, 33)).toEqual([1, "ellipsis", 16, 17, 18, "ellipsis", 33]);
  });

  it("never duplicates adjacent pages when the window touches an edge", () => {
    expect(buildPageList(2, 33)).toEqual([1, 2, 3, "ellipsis", 33]);
  });
});
