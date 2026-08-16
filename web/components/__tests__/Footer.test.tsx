import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

describe("Footer disclaimer", () => {
  it("names both DHET and SAQA as the independent registers it is not affiliated with", () => {
    render(<Footer />);

    const disclaimer = screen.getByText(/Disclaimer:/).closest("p");
    expect(disclaimer).toHaveTextContent("Department of Higher Education and Training (DHET)");
    expect(disclaimer).toHaveTextContent("South African Qualifications Authority (SAQA)");
    expect(disclaimer).toHaveTextContent("DHET and SAQA registers");
  });
});
