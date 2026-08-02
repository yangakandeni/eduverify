"use client";

import { BadgeCheck, ChevronDown, GraduationCap, Globe, Mail, MapPin, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TYPE_LABEL, getStatusBadge } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

export default function InstitutionCard({ institution }: { institution: InstitutionRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [qualQuery, setQualQuery] = useState("");
  const { name, tradingName, registration_number, address, province, contacts, qualifications, institutionType } =
    institution;
  const badge = getStatusBadge(institution);

  const filteredQualifications = useMemo(() => {
    const q = qualQuery.trim().toLowerCase();
    if (!q) return qualifications;
    return qualifications.filter((qualification) => qualification.title.toLowerCase().includes(q));
  }, [qualifications, qualQuery]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
                  badge.verified ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {badge.label}
              </span>
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground">
                {TYPE_LABEL[institutionType] ?? institutionType}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {name}
              {tradingName && <span className="ml-2 text-sm font-normal text-muted-foreground">({tradingName})</span>}
            </h3>
          </div>
          {registration_number && (
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Registration No.</div>
              <div className="font-mono font-medium text-foreground">{registration_number}</div>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-secondary"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          ))}
          {contacts.phone.slice(0, 1).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-secondary"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-secondary"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>
      </div>

      {qualifications.length > 0 && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" />
              {qualifications.length} Accredited Qualification{qualifications.length === 1 ? "" : "s"} Available
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {expanded && (
            <div className="space-y-3 border-t border-border px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={qualQuery}
                  onChange={(event) => setQualQuery(event.target.value)}
                  placeholder="Filter qualifications (e.g. Computer, Business, NQF 7)..."
                  className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/40"
                />
              </div>

              {filteredQualifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No qualifications match &quot;{qualQuery}&quot;.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredQualifications.map((qualification, index) => (
                    <div key={`${qualification.title}-${index}`} className="rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        {qualification.nqfLevel && (
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                            NQF {qualification.nqfLevel}
                          </span>
                        )}
                        {qualification.saqaId && <span className="font-mono text-xs text-muted-foreground">SAQA {qualification.saqaId}</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground">{qualification.title}</p>
                      {(qualification.mode || qualification.credits) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
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
