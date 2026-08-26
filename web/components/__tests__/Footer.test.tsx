import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- test double, alt comes from spread props
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

describe("Footer disclaimer", () => {
  it("names both DHET and SAQA as the independent registers it is not affiliated with", () => {
    render(<Footer />);

    const disclaimer = screen.getByText(/Disclaimer:/).closest("p");
    expect(disclaimer).toHaveTextContent("Department of Higher Education and Training (DHET)");
    expect(disclaimer).toHaveTextContent("South African Qualifications Authority (SAQA)");
    expect(disclaimer).toHaveTextContent("DHET and SAQA registers");
  });
});

describe("Footer logo", () => {
  it("renders the EduVerify logo graphic and wordmark images instead of a plain text span", () => {
    render(<Footer />);

    expect(screen.getByRole("img", { name: "EduVerify" })).toHaveAttribute(
      "src",
      "/assets/images/eduverify-logo-text.png",
    );
    expect(screen.queryByText("EduVerify", { selector: "span" })).not.toBeInTheDocument();
  });
});
