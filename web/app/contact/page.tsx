import { Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — EduVerify",
  description: "Get in touch with the EduVerify team for support, verification inquiries, or partnerships.",
};

const WHATSAPP_LINK = "https://wa.me/27848008040?text=Hello%20EduVerify%20Support";

export default function ContactPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            We are here for prospective students, parents, and institution partners across South&nbsp;Africa.&nbsp;Reach our team
            for support, verification inquiries, or partnerships.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Mail className="h-5 w-5 text-indigo-600" />
            </span>
            <h2 className="font-display text-lg font-bold text-foreground">Email Support</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              General support, partner inquiries, and data updates.
            </p>
            <a
              href="mailto:techoloshe@gmail.com"
              className="mt-1 text-sm font-semibold text-accent underline hover:no-underline"
            >
              techoloshe@gmail.com
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </span>
            <h2 className="font-display text-lg font-bold text-foreground">WhatsApp Support</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Reach our support team through WhatsApp for fast responses.
            </p>
            <p className="mt-1 font-mono text-sm text-foreground">084 800 8040</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
