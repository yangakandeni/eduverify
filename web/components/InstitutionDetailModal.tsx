"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Globe, Mail, Phone, X, XCircle } from "lucide-react";
import {
  TYPE_LABEL,
  getBrandColor,
  getDisplayName,
  getInitials,
  getRegistrationDetails,
  getStatusBadge,
} from "@/lib/presentation";
import { institutionCategoryLabels } from "@/lib/categories";
import {
  CANONICAL_PROVINCES,
  formatAddressLines,
  normalizeProvince,
  parseInstitutionAddresses,
} from "@/lib/normalize";
import type { InstitutionRecord } from "@/lib/types";

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

const PILL_BUTTON_CLASS =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm";

export default function InstitutionDetailModal({
  institution,
  onClose,
}: {
  institution: InstitutionRecord;
  onClose: () => void;
}) {
  const { name, tradingName, address, province, contacts, qualifications, institutionType } = institution;
  const badge = getStatusBadge(institution);
  const displayName = getDisplayName(name, tradingName);
  const categoryPills = institutionCategoryLabels(institution).slice(0, 3);
  const registrationDetails = getRegistrationDetails(institution);

  const locations = useMemo(
    () => parseInstitutionAddresses(address, CANONICAL_PROVINCES, province ?? undefined),
    [address, province],
  );
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id);
  const activeLocation = locations.find((location) => location.id === selectedLocationId) ?? locations[0];

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
            badge.cancelled ? "bg-rose-50 text-rose-700" : badge.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {badge.cancelled ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : badge.verified ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {badge.label}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {registrationDetails.label}
            </div>
            <div className="mt-0.5 text-sm font-medium text-foreground">{registrationDetails.value}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Locations</div>
            {locations.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      location.id === activeLocation?.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                  {normalizeProvince(province)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Address</div>
          <div className="my-2 space-y-0.5 text-sm font-medium text-slate-800">
            {formatAddressLines(activeLocation?.address ?? address).map((line, idx) => (
              <p key={idx} className="leading-snug">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 my-4">
          {contacts.email.slice(0, 1).map((email) => (
            <a key={email} href={`mailto:${email}`} className={PILL_BUTTON_CLASS}>
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email
            </a>
          ))}
          {contacts.phone.slice(0, 1).map((phone) => (
            <a key={phone} href={`tel:${phone.replace(/\s+/g, "")}`} className={PILL_BUTTON_CLASS}>
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Call
            </a>
          ))}
          {contacts.website && (
            <a
              href={websiteHref(contacts.website)}
              target="_blank"
              rel="noopener noreferrer"
              className={PILL_BUTTON_CLASS}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Website
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
