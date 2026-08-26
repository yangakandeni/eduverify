import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "@/components/Nav";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- test double, alt comes from spread props
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

vi.mock("@clerk/nextjs", () => ({
  Show: () => null,
  UserButton: () => <div data-testid="user-button" />,
}));

describe("Nav logo", () => {
  it("renders the EduVerify logo graphic and wordmark images as the homepage link, instead of a plain text span", () => {
    render(<Nav />);

    const homeLink = screen.getByRole("link", { name: "EduVerify" });
    expect(homeLink).toHaveAttribute("href", "/");

    const wordmark = screen.getByRole("img", { name: "EduVerify" });
    expect(wordmark).toHaveAttribute("src", "/assets/images/eduverify-logo-text.png");

    expect(screen.queryByText("EduVerify", { selector: "span" })).not.toBeInTheDocument();
  });
});
