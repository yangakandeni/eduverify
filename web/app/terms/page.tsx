import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — EduVerify",
  description: "The terms that govern your use of EduVerify's institution lookup and discovery tools.",
};

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: "By using EduVerify, you agree to these terms. If you do not agree, please discontinue use of the platform.",
  },
  {
    title: "Verification & Data Accuracy Disclaimer",
    body: "While we make every effort to keep our indexed register data up to date, official registration status remains strictly governed by the DHET and SAQA. EduVerify provides search results on an \"as-is\" informational basis. Users are advised to confirm final enrollment details directly with the official register or institution.",
  },
  {
    title: "Monetization & Promoted Content Transparency",
    body: "Promoted or featured placement within designated promotional areas (such as the Hero Showcase) represents sponsored partnerships. Sponsored placements do not alter organic search relevance or official accreditation status.",
  },
  {
    title: "Limitation of Liability",
    body: "EduVerify is not liable for financial losses, fee disputes, or enrollment decisions made between users and listed institutions.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Last Updated: August 2026</p>

        <div className="mt-10 flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
