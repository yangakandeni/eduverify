import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BackToHomeButton from "@/components/BackToHomeButton";

describe("BackToHomeButton", () => {
  it("renders a link back to the homepage", () => {
    render(<BackToHomeButton />);

    const link = screen.getByRole("link", { name: /back/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
