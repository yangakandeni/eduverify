import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Analytics from "@/components/Analytics";
import BackToTopButton from "@/components/BackToTopButton";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Nav from "@/components/Nav";
import { clerkAppearance } from "@/lib/clerkAppearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EduVerify — Higher Education Register Lookup",
  description:
    "Search South Africa's public universities and DHET- and SAQA-registered private higher education institutions. EduVerify is an independent verification utility and is not affiliated with DHET or SAQA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
      <html
        lang="en"
        className={`${inter.variable} ${plusJakartaSans.variable} ${dmMono.variable} h-full scroll-smooth antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <GoogleAnalytics />
          <Nav />
          {children}
          <Footer />
          <BackToTopButton />
        </body>
        <Analytics />
      </html>
    </ClerkProvider>
  );
}
