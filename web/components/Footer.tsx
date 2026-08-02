import { Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

const BUILD_VERSION = "1.0.0";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-base font-semibold">EduVerify SA</span>
            </div>
            <p className="mt-3 text-sm">
              Protecting prospective students by providing transparent higher education
              verification.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-600">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-600">
                  Public Universities
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-600">
                  Private Colleges
                </Link>
              </li>
              <li>
                <a
                  href="https://www.dhet.gov.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600"
                >
                  DHET Direct Portal
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Legal &amp; Compliance</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Not affiliated with DHET</li>
              <li>Privacy Policy</li>
              <li>Terms of Use</li>
              <li>Data Accuracy Disclaimer</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Contact &amp; Source</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <a href="mailto:support@eduverify.co.za" className="hover:text-emerald-600">
                  support@eduverify.co.za
                </a>
              </li>
              <li>
                <a
                  href="https://www.dhet.gov.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600"
                >
                  DHET higher education registers
                </a>
              </li>
              <li className="text-xs text-slate-400">Build v{BUILD_VERSION}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {year} EduVerify SA. All rights reserved.
      </div>
    </footer>
  );
}
