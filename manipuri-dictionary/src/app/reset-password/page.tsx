import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Manipuri Dictionary account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold mb-2">Invalid reset link</h1>
            <p className="text-muted-foreground">
              This reset link is missing its token. Please request a new one.
            </p>
          </div>
        )}
      </main>
    </>
  );
}