import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";

describe("About page disclaimer", () => {
  it("names both DHET and SAQA as the regulators it is not affiliated with", () => {
    render(<AboutPage />);

    const disclaimer = screen.getByText(/is an independent discovery platform\. We are not operated by/);
    expect(disclaimer).toHaveTextContent("Department of Higher Education and Training (DHET)");
    expect(disclaimer).toHaveTextContent("South African Qualifications Authority (SAQA)");
  });

  it("mentions SAQA alongside DHET in the instant verification pillar", () => {
    render(<AboutPage />);

    expect(screen.getByText(/officially registered with DHET and SAQA/)).toBeInTheDocument();
  });
});
