import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('script[data-nscript]').forEach((el) => el.remove());
});

describe("GoogleAnalytics", () => {
  it("injects no gtag script when NEXT_PUBLIC_GA_MEASUREMENT_ID is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    render(<GoogleAnalytics />);

    expect(document.querySelector('script[src*="googletagmanager.com"]')).not.toBeInTheDocument();
  });

  it("injects the gtag.js loader and config script for the configured measurement ID", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-Y34FRCV2HZ");
    render(<GoogleAnalytics />);

    const loader = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    expect(loader).toHaveAttribute(
      "src",
      "https://www.googletagmanager.com/gtag/js?id=G-Y34FRCV2HZ",
    );

    const config = document.getElementById("google-analytics");
    expect(config?.textContent).toContain("gtag('config', 'G-Y34FRCV2HZ')");
  });
});
