import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — EduVerify",
  description: "How EduVerify collects, uses, and protects information when you use our institution lookup tool.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "We collect anonymous usage analytics, search queries, and province-level geolocation, which we use solely to personalize local institution recommendations. We do not store personal student identification records.",
  },
  {
    title: "Cookies & Local Storage",
    body: "We use cookies and local storage to remember your preferences, such as saved or favourite institutions and search filters, so your experience persists across visits.",
  },
  {
    title: "Data Sources",
    body: "Information displayed on EduVerify is gathered from publicly accessible registers published by the Department of Higher Education and Training (DHET) and the South African Qualifications Authority (SAQA), and accredited quality councils (CHE).",
  },
  {
    title: "User Rights & Inquiries",
    body: (
      <>
        If you have questions about your data or this policy, you can contact us at{" "}
        <a href="mailto:techoloshe@gmail.com" className="font-medium text-accent underline hover:no-underline">
          techoloshe@gmail.com
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
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
