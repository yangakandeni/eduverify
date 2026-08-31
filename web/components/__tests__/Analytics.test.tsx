import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const googleAnalyticsMock = vi.fn(({ gaId }: { gaId: string }) => (
  <div data-testid="google-analytics" data-ga-id={gaId} />
));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: (props: { gaId: string }) => googleAnalyticsMock(props),
}));

const ORIGINAL_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

describe("Analytics", () => {
  beforeEach(() => {
    googleAnalyticsMock.mockClear();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ORIGINAL_GA_ID;
  });

  it("renders GoogleAnalytics with the configured measurement ID", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
    const { default: Analytics } = await import("@/components/Analytics");

    const { getByTestId } = render(<Analytics />);

    expect(getByTestId("google-analytics")).toHaveAttribute(
      "data-ga-id",
      "G-TEST12345",
    );
  });

  it("renders nothing when no measurement ID is configured", async () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const { default: Analytics } = await import("@/components/Analytics");

    const { container } = render(<Analytics />);

    expect(container).toBeEmptyDOMElement();
    expect(googleAnalyticsMock).not.toHaveBeenCalled();
  });
});
