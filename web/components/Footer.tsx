import Link from "next/link";

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Feedback", href: "/feedback" },
  { label: "Cookie Preferences", href: "/cookie-preferences" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-400">
          EduVerify is an independent directory and is not affiliated with or operated by the
          Department of Higher Education and Training (DHET).
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">© {year} EduVerify</p>
      </div>
    </footer>
  );
}
