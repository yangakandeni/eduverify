"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { buildCollections, type Collection } from "@/lib/collections";
import { PRIMARY_CATEGORY_KEYS, getCategory, institutionMatchesCategory } from "@/lib/categories";
import { TYPE_LABEL, getBrandColor, getDisplayName, getInitials, getStatusBadge, type StatusBadge } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

const FADE_TRANSITION = { duration: 0.2, ease: "easeInOut" as const };

interface HeroShowcaseProps {
  institutions: InstitutionRecord[];
  onExplore: (institution: InstitutionRecord) => void;
}

export default function HeroShowcase({ institutions, onExplore }: HeroShowcaseProps) {
  const collections = useMemo(() => buildCollections(institutions), [institutions]);
  const [collectionIndex, setCollectionIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Modulo (rather than a corrective effect) keeps indices valid even if `collections`
  // shrinks — e.g. right after the institutions list first loads.
  const safeCollectionIndex = collections.length > 0 ? collectionIndex % collections.length : 0;
  const activeCollection: Collection | undefined = collections[safeCollectionIndex];
  const safeFeaturedIndex =
    activeCollection && activeCollection.institutions.length > 0 ? featuredIndex % activeCollection.institutions.length : 0;

  function goToCollection(index: number) {
    setCollectionIndex(index);
    setFeaturedIndex(0);
  }

  if (!activeCollection) return null;

  const main = activeCollection.institutions[safeFeaturedIndex];
  const supporting = activeCollection.institutions.filter((_, index) => index !== safeFeaturedIndex);

  return (
    <section className="bg-background px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Curated Collections</p>
            <h2 className="font-display text-2xl font-bold text-foreground">Explore Institutions</h2>
          </div>
          <div className="flex items-center gap-2">
            {collections.map((collection, index) => (
              <button
                key={collection.key}
                type="button"
                onClick={() => goToCollection(index)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  index === safeCollectionIndex
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {collection.title}
              </button>
            ))}
            <div className="ml-2 flex gap-1">
              <button
                type="button"
                aria-label="Previous collection"
                onClick={() => goToCollection((safeCollectionIndex - 1 + collections.length) % collections.length)}
                className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next collection"
                onClick={() => goToCollection((safeCollectionIndex + 1) % collections.length)}
                className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <motion.div
          key={activeCollection.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={main.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={FADE_TRANSITION}
              >
                <MainCard institution={main} sponsored={activeCollection.sponsoredIds.has(main.id)} onExplore={onExplore} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-1">
            {supporting.map((institution) => {
              const realIndex = activeCollection.institutions.findIndex((item) => item.id === institution.id);
              return (
                <motion.div
                  key={institution.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={FADE_TRANSITION}
                >
                  <SmallCard
                    institution={institution}
                    sponsored={activeCollection.sponsoredIds.has(institution.id)}
                    onSelect={() => setFeaturedIndex(realIndex)}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
      <Sparkles className="h-3 w-3 text-amber-500" />
      Featured
    </span>
  );
}

function SponsoredBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm">
      <BadgePercent className="h-3 w-3" />
      Sponsored
    </span>
  );
}

function StatusPill({ badge }: { badge: StatusBadge }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide ${
        badge.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-600" : "bg-amber-100 text-amber-800"
      }`}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {badge.verified ? "Registered" : badge.label}
    </span>
  );
}

function websiteHref(website: string): string {
  return website.startsWith("http") ? website : `https://${website}`;
}

function MainCard({
  institution,
  sponsored,
  onExplore,
}: {
  institution: InstitutionRecord;
  sponsored: boolean;
  onExplore: (institution: InstitutionRecord) => void;
}) {
  const badge = getStatusBadge(institution);
  const brandColor = getBrandColor(institution);
  const categories = PRIMARY_CATEGORY_KEYS.filter((key) => institutionMatchesCategory(institution, key))
    .map((key) => getCategory(key))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const website = institution.contacts.website;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <div className="relative px-6 py-6 sm:px-8 sm:py-7" style={{ backgroundColor: brandColor }}>
        {(sponsored || institution.isFeatured) && (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {sponsored && <SponsoredBadge />}
            {institution.isFeatured && <FeaturedBadge />}
          </div>
        )}
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/70">
          {TYPE_LABEL[institution.institutionType] ?? institution.institutionType}
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
          {getDisplayName(institution.name, institution.tradingName)}
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="mt-3 flex flex-row flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <StatusPill badge={badge} />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {institution.province && institution.province !== "Unknown" ? institution.province : institution.address}
            </span>
          </span>
          <span className="inline-flex flex-shrink-0 items-center gap-1.5">
            <GraduationCap className="h-4 w-4 flex-shrink-0" />
            {institution.qualifications.length} qualifications
          </span>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category.key} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {category.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <button
            type="button"
            onClick={() => onExplore(institution)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Institution
          </button>
          {website && (
            <a
              href={websiteHref(website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallCard({
  institution,
  sponsored,
  onSelect,
}: {
  institution: InstitutionRecord;
  sponsored: boolean;
  onSelect: () => void;
}) {
  const brandColor = getBrandColor(institution);
  const badge = getStatusBadge(institution);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {sponsored && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          Sponsored
        </span>
      )}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
        style={{ backgroundColor: brandColor }}
      >
        {getInitials(institution.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {getDisplayName(institution.name, institution.tradingName)}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {institution.province && institution.province !== "Unknown" ? institution.province : TYPE_LABEL[institution.institutionType]}
        </p>
      </div>
      <span
        className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${
          badge.verified ? "border border-emerald-200 bg-emerald-50 text-emerald-600" : "bg-amber-100 text-amber-800"
        }`}
      >
        <BadgeCheck className="h-3 w-3" />
        {badge.verified ? "Registered" : "Provisional"}
      </span>
    </button>
  );
}
