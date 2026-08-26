import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthLayout from "@/components/AuthLayout";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- test double, alt comes from spread props
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

describe("AuthLayout logo", () => {
  it("renders the EduVerify logo graphic and wordmark images as the homepage link, instead of a Shield icon and text span", () => {
    const { container } = render(<AuthLayout>{null}</AuthLayout>);

    const homeLink = screen.getByRole("link", { name: "EduVerify" });
    expect(homeLink).toHaveAttribute("href", "/");

    expect(container.querySelector('img[src="/assets/images/eduverify-logo-graphic.png"]')).not.toBeNull();

    const wordmark = screen.getByRole("img", { name: "EduVerify" });
    expect(wordmark).toHaveAttribute("src", "/assets/images/eduverify-logo-text.png");
  });
});
