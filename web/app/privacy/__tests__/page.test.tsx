import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/privacy/page";

describe("Privacy page data sources", () => {
  it("names SAQA as a primary register alongside DHET, not just a parenthetical quality council", () => {
    render(<PrivacyPage />);

    const dataSources = screen.getByText(/Information displayed on EduVerify is gathered from/);
    expect(dataSources).toHaveTextContent("Department of Higher Education and Training (DHET)");
    expect(dataSources).toHaveTextContent("South African Qualifications Authority (SAQA)");
  });
});
