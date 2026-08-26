import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-primary px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(245,166,35,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 35%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <Image src="/assets/images/eduverify-logo-graphic.png" alt="" width={80} height={74} className="h-15 w-auto" />
          <Image src="/assets/images/eduverify-logo-text.png" alt="EduVerify" width={1038} height={240} className="h-10 w-auto mb-[-35px]" />
        </Link>
        {children}
      </div>
    </main>
  );
}
