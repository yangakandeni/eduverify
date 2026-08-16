import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BackToHomeButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="group inline-flex self-start items-center justify-center rounded-full p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-6 w-6 text-muted-foreground transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-foreground" />
    </Link>
  );
}
