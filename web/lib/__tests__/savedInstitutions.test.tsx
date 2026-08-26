import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { act } from "@testing-library/react";
import { useSavedInstitutions } from "@/lib/savedInstitutions";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false, isLoaded: true }),
}));

const SAVED_KEY = "eduverify:saved";

function Wrapper({ id }: { id: string }) {
  const [savedIds] = useSavedInstitutions();
  return <div>{savedIds.has(id) ? "saved" : "not-saved"}</div>;
}

describe("useSavedInstitutions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
  });

  it("renders the SSR-safe empty state on the client's first paint, even when localStorage already has a saved id", () => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(["inst-1"]));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    // Deliberately outside act(): mirrors the real hydration timing, where the
    // mount effect that reconciles localStorage runs after the first commit,
    // not synchronously as part of it.
    flushSync(() => {
      root.render(<Wrapper id="inst-1" />);
    });

    expect(container.textContent).toBe("not-saved");

    consoleErrorSpy.mockRestore();
  });

  it("reconciles with localStorage shortly after mount", async () => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(["inst-1"]));

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<Wrapper id="inst-1" />);
    });

    expect(container.textContent).toBe("saved");
  });
});
