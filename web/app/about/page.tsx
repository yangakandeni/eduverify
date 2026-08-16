import { Compass, Info, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — EduVerify",
  description:
    "EduVerify is an independent discovery platform that turns public DHET and SAQA registers into an intuitive search and verification tool for prospective students.",
};

const VALUE_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Instant Verification",
    description:
      "Easily confirm if an institution is officially registered with DHET and SAQA before paying tuition or application fees.",
  },
  {
    icon: Compass,
    title: "Comprehensive Discovery",
    description:
      "Explore accredited degrees, diplomas, and higher certificates across public universities, TVETs, and private colleges.",
  },
  {
    icon: ShieldCheck,
    title: "Unbiased & Independent",
    description: "We provide objective lookup tools designed to make higher education navigation effortless.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">About EduVerify</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Empowering South African Students Through Higher Education Transparency.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Our mission is to protect prospective students and parents from unaccredited (&ldquo;bogus&rdquo;) institutions by
            turning public registers into an intuitive, accessible search and discovery engine.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUE_PILLARS.map((pillar) => (
            <div key={pillar.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <pillar.icon className="h-5 w-5 text-accent-foreground" />
              </span>
              <h2 className="font-display text-lg font-bold text-foreground">{pillar.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-foreground">
            <strong>EduVerify</strong> is an independent discovery platform. We are not operated by, directly affiliated
            with, or endorsed by the Department of Higher Education and Training (DHET) or the South African
            Qualifications Authority (SAQA). Registration data is indexed from official public registers.
          </p>
        </div>
      </section>
    </main>
  );
}
