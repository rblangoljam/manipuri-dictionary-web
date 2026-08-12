import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { SettingsForm } from "@/components/settings-form";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Account Settings — Manipuri Dictionary",
  description: "Manage your account settings.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const userId = parseInt(session.user.id, 10);
  const rows = await prisma.$queryRaw<Array<{ name: string; email: string }>>`
    SELECT name, email FROM users WHERE id = ${userId} LIMIT 1
  `;

  const user = rows[0] ?? { name: session.user.name ?? "", email: session.user.email ?? "" };

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          <SettingsForm initialName={user.name} initialEmail={user.email} />
        </div>
      </main>
    </>
  );
}