"use client";

import { BookOpen, Menu, Shield, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "About", href: "/#about" }, // TODO: Update this link to point to the actual About page when it exists
  { label: "Browse", href: "/#browse" },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-primary">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-accent">
            <Shield className="h-3.5 w-3.5 text-accent-foreground" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">EduVerify</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-white/70 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.dhet.gov.za"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm text-white/70 transition hover:text-white sm:flex"
          >
            <BookOpen className="h-3.5 w-3.5" />
            DHET Register
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="text-white/70 transition hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-3 border-t border-white/10 bg-primary px-6 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-left text-sm font-medium text-white/70 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://www.dhet.gov.za"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
          >
            {/* <BookOpen className="h-3.5 w-3.5" /> */}
            DHET Register
          </a>
        </div>
      )}
    </nav>
  );
}
