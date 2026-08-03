"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Menu, Shield, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS: any[] = [];

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
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:block"
            >
              Log In
            </Link>
            <Link
              href="/sign-up"
              className="hidden items-center rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:flex"
            >
              Get Started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white sm:flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <UserButton />
          </Show>
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
          <Show when="signed-out">
            <Link
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="text-left text-sm font-medium text-white/70 transition hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMobileOpen(false)}
              className="flex w-fit items-center rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Get Started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Show>
        </div>
      )}
    </nav>
  );
}
