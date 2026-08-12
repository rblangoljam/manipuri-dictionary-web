import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Manipuri Dictionary password.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <ForgotPasswordForm />
      </main>
    </>
  );
}