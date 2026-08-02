import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthLayout from "@/components/AuthLayout";

export const metadata: Metadata = {
  title: "Log In — EduVerify",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </AuthLayout>
  );
}
