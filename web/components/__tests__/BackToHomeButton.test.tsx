import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BackToHomeButton from "@/components/BackToHomeButton";

describe("BackToHomeButton", () => {
  it("renders a link back to the homepage", () => {
    render(<BackToHomeButton />);

    const link = screen.getByRole("link", { name: /back/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders as an icon-only button with no visible 'Back' text or border", () => {
    render(<BackToHomeButton />);

    const link = screen.getByRole("link", { name: /back/i });
    expect(link).not.toHaveTextContent("Back");
    expect(link.className).not.toMatch(/\bborder\b/);
  });
});
