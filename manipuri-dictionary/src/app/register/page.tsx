import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Create Your Account",
  description: "Create your Manipuri Dictionary account.",
};

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <RegisterForm />
      </main>
    </>
  );
}