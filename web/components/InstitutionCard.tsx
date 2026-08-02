"use client";

import { BadgeCheck, ChevronDown, GraduationCap, Globe, Mail, MapPin, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { InstitutionRecord, InstitutionType } from "@/lib/types";

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

const TYPE_LABEL: Record<InstitutionType, string> = {
  "Public University": "Public University",
  "Private Higher Education Institution": "Private Institution",
  "TVET College": "TVET College",
};

export default function InstitutionCard({ institution }: { institution: InstitutionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [qualQuery, setQualQuery] = useState("");
  const { name, tradingName, registration_number, status, address, province, contacts, qualifications, institutionType } =
    institution;

  const filteredQualifications = useMemo(() => {
    const q = qualQuery.trim().toLowerCase();
    if (!q) return qualifications;
    return qualifications.filter((qualification) => qualification.title.toLowerCase().includes(q));
  }, [qualifications, qualQuery]);

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
                {status || "Verified"}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {TYPE_LABEL[institutionType] ?? institutionType}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {name}
              {tradingName && (
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({tradingName})</span>
              )}
            </h3>
          </div>
          {registration_number && (
            <div className="text-right text-sm">
              <div className="text-slate-500 dark:text-slate-400">Registration No.</div>
              <div className="font-mono font-medium text-slate-900 dark:text-white">{registration_number}</div>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>
              {address}
              {province ? ` · ${province}` : ""}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {contacts.email.slice(0, 1).map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          ))}
          {contacts.phone.slice(0, 1).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          ))}
          {contacts.website && (
            <a
              href={websiteHref(contacts.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>
      </div>

      {qualifications.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              {qualifications.length} Accredited Qualification{qualifications.length === 1 ? "" : "s"} Available
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {expanded && (
            <div className="space-y-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={qualQuery}
                  onChange={(event) => setQualQuery(event.target.value)}
                  placeholder="Filter qualifications (e.g. Computer, Business, NQF 7)..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {filteredQualifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No qualifications match &quot;{qualQuery}&quot;.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredQualifications.map((qualification, index) => (
                    <div
                      key={`${qualification.title}-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        {qualification.nqfLevel && (
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            NQF {qualification.nqfLevel}
                          </span>
                        )}
                        {qualification.saqaId && (
                          <span className="text-xs font-mono text-slate-400">SAQA {qualification.saqaId}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{qualification.title}</p>
                      {(qualification.mode || qualification.credits) && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {qualification.mode}
                          {qualification.mode && qualification.credits ? " · " : ""}
                          {qualification.credits ? `${qualification.credits} credits` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
