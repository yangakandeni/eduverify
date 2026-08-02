"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { buildCollections, type Collection } from "@/lib/collections";
import { TYPE_LABEL, getAvatarPalette, getInitials, getShortDescription } from "@/lib/presentation";
import type { InstitutionRecord } from "@/lib/types";

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
    <section className="bg-slate-50/50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{activeCollection.title}</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous collection"
              onClick={() => goToCollection((safeCollectionIndex - 1 + collections.length) % collections.length)}
              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next collection"
              onClick={() => goToCollection((safeCollectionIndex + 1) % collections.length)}
              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div
          key={activeCollection.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <motion.div
            key={main.id}
            layoutId={`hero-card-${main.id}`}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="sm:col-span-2"
          >
            <MainCard institution={main} sponsored={activeCollection.sponsoredIds.has(main.id)} onExplore={onExplore} />
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:col-span-1">
            {supporting.map((institution) => {
              const realIndex = activeCollection.institutions.findIndex((item) => item.id === institution.id);
              return (
                <motion.div
                  key={institution.id}
                  layoutId={`hero-card-${institution.id}`}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {collections.map((collection, index) => (
            <button
              key={collection.key}
              type="button"
              aria-label={`Show ${collection.title}`}
              onClick={() => goToCollection(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === safeCollectionIndex ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
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

function MainCard({
  institution,
  sponsored,
  onExplore,
}: {
  institution: InstitutionRecord;
  sponsored: boolean;
  onExplore: (institution: InstitutionRecord) => void;
}) {
  const palette = getAvatarPalette(institution.id);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {sponsored && <SponsoredBadge />}
        <FeaturedBadge />
      </div>

      <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold ${palette}`}>
        {getInitials(institution.name)}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          {TYPE_LABEL[institution.institutionType] ?? institution.institutionType}
        </span>
      </div>

      <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{institution.name}</h2>

      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="line-clamp-1">{institution.address}</span>
      </div>

      <p className="mt-3 max-w-lg text-sm text-slate-600">{getShortDescription(institution)}</p>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
          <GraduationCap className="h-4 w-4" />
          {institution.qualifications.length} Qualifications
        </span>
        <button
          type="button"
          onClick={() => onExplore(institution)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Explore Institution
          <ArrowRight className="h-4 w-4" />
        </button>
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
  const palette = getAvatarPalette(institution.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative flex h-full w-full flex-col items-start justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {sponsored && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          Sponsored
        </span>
      )}
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${palette}`}>
        {getInitials(institution.name)}
      </div>
      <div className="mt-2">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{institution.name}</p>
        <p className="mt-1 text-xs text-slate-500">{institution.qualifications.length} qualifications</p>
      </div>
    </button>
  );
}
