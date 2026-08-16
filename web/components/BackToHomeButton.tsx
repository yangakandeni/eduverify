import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BackToHomeButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Link>
  );
}
