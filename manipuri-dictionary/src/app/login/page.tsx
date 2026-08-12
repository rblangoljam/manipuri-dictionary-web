import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Manipuri Dictionary account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <LoginForm callbackUrl={callbackUrl} />
      </main>
    </>
  );
}
