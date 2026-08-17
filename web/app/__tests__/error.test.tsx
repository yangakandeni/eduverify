import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "@/app/error";

describe("app/error.tsx", () => {
  it("shows the service-unavailable message, not a raw stack trace", () => {
    render(<ErrorPage error={new Error("ApiError: 503")} unstable_retry={vi.fn()} />);

    expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/ApiError/)).not.toBeInTheDocument();
  });

  it("calls unstable_retry when 'Try again' is clicked", () => {
    const unstableRetry = vi.fn();
    render(<ErrorPage error={new Error("boom")} unstable_retry={unstableRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(unstableRetry).toHaveBeenCalledTimes(1);
  });
});
