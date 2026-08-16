import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta-sans" }),
  DM_Mono: () => ({ variable: "--font-dm-mono" }),
}));

const { metadata } = await import("@/app/layout");

describe("root layout metadata", () => {
  it("mentions both DHET and SAQA in the SEO description", () => {
    const description = String(metadata.description);
    expect(description).toContain("DHET");
    expect(description).toContain("SAQA");
  });
});
