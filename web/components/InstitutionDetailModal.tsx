"use client";

import { CheckCircle2, Clock, Globe, Mail, Phone, X } from "lucide-react";
import { TYPE_LABEL, getBrandColor, getDisplayName, getInitials, getStatusBadge } from "@/lib/presentation";
import { institutionCategoryLabels } from "@/lib/categories";
import type { InstitutionRecord } from "@/lib/types";

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

export default function InstitutionDetailModal({
  institution,
  onClose,
}: {
  institution: InstitutionRecord;
  onClose: () => void;
}) {
  const { name, tradingName, registration_number, address, province, contacts, qualifications, institutionType } =
    institution;
  const badge = getStatusBadge(institution);
  const displayName = getDisplayName(name, tradingName);
  const categoryPills = institutionCategoryLabels(institution).slice(0, 3);

  return (
    <div className="flex flex-col">
      <div
        className="flex items-start justify-between gap-3 px-5 py-5"
        style={{ backgroundColor: getBrandColor(institution) }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/90 font-display text-sm font-bold text-foreground">
            {getInitials(name)}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-white" title={name}>
              {displayName}
            </h2>
            <p className="mt-0.5 text-sm text-white/80">{TYPE_LABEL[institutionType] ?? institutionType}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            badge.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {badge.verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {badge.label}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {registration_number && (
            <div>
              <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Registration No.</div>
              <div className="mt-0.5 text-sm font-medium text-foreground">{registration_number}</div>
            </div>
          )}
          {province && (
            <div>
              <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Province</div>
              <div className="mt-0.5 text-sm font-medium text-foreground">{province}</div>
            </div>
          )}
        </div>

        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Address</div>
          <p className="mt-0.5 text-sm text-foreground">{address}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground">
          {contacts.phone.slice(0, 1).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 transition hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {phone}
            </a>
          ))}
          {contacts.email.slice(0, 1).map((email) => (
            <a key={email} href={`mailto:${email}`} className="inline-flex items-center gap-1.5 transition hover:text-primary">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {email}
            </a>
          ))}
          {contacts.website && (
            <a
              href={websiteHref(contacts.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-primary"
            >
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {contacts.website}
            </a>
          )}
        </div>

        {qualifications.length > 0 && (
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Accredited Qualifications
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categoryPills.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {label}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {qualifications.length} total
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground justify-center text-center">
        EduVerify is an independent platform — verify at{" "}
        <a
          href="https://www.dhet.gov.za"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          www.dhet.gov.za
        </a>
        .
      </div>
    </div>
  );
}
