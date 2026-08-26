import Image from "next/image";
import Link from "next/link";

const PLATFORM_LINKS = [
  { label: "Verify Institution", href: "/#" },
  { label: "Browse Institutions", href: "/#browse" },
];

const LEGAL_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary text-white/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Image src="/assets/images/eduverify-logo-graphic.png" alt="" width={80} height={74} className="h-10 w-auto" />
              <Image src="/assets/images/eduverify-logo-text.png" alt="EduVerify" width={1038} height={240} className="h-8 w-auto mb-[-18px] ml-[-8px]" />
            </div>

            <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed">
              <strong className="text-white/80">Disclaimer:</strong> EduVerify is an independent South African platform for verifying higher education institutions and accredited qualifications.
              It is not affiliated with or operated by the Department of Higher Education and Training (DHET) or the South African Qualifications Authority (SAQA).
              Data is sourced from publicly available DHET and SAQA registers and official records.</p>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white">Platform</p>
            <ul className="flex flex-col gap-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white">Legal &amp; Info</p>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="font-mono text-xs">© {year} EduVerify.</p>
        </div>
      </div>
    </footer>
  );
}
