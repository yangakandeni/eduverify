import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthLayout from "@/components/AuthLayout";

export const metadata: Metadata = {
  title: "Get Started — EduVerify",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </AuthLayout>
  );
}
