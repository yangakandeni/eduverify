"use client";

import { BadgeCheck, ChevronDown, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { InstitutionRecord } from "@/lib/types";

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

export default function InstitutionCard({ institution }: { institution: InstitutionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const { name, registration_number, status, address, province, contacts, qualifications } = institution;

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
              <BadgeCheck className="h-3.5 w-3.5" />
              {status || "Verified"}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          </div>
          {registration_number && (
            <div className="text-right text-sm">
              <div className="text-slate-500">Registration No.</div>
              <div className="font-mono font-medium text-slate-900">{registration_number}</div>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-slate-700">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          ))}
          {contacts.phone.slice(0, 1).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>
      </div>

      {qualifications.length > 0 && (
        <div className="border-t border-emerald-200">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100/60"
          >
            <span>{qualifications.length} accredited qualification{qualifications.length === 1 ? "" : "s"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <ul className="space-y-1 px-5 pb-4 text-sm text-slate-700">
              {qualifications.map((qualification) => (
                <li key={qualification} className="border-l-2 border-emerald-300 pl-3">
                  {qualification}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
