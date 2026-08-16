import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsPage from "@/app/terms/page";

describe("Terms page verification disclaimer", () => {
  it("says registration status is governed by both DHET and SAQA", () => {
    render(<TermsPage />);

    expect(screen.getByText(/strictly governed by the DHET and SAQA/)).toBeInTheDocument();
  });
});
