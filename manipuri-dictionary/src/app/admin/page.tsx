import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Inbox, Users, ShieldCheck } from "lucide-react";
import { Header } from "@/components/header";
import { AdminNav } from "@/components/admin/admin-nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const metadata = {
  title: "Admin Dashboard — Manipuri Dictionary",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  const count = (rows: Array<{ c: bigint }>) => Number(rows[0]?.c ?? 0);

  const [published, pending, users, moderators] = await Promise.all([
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT COUNT(*) AS c FROM words`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT COUNT(*) AS c FROM edit_proposals WHERE status='pending'`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT COUNT(*) AS c FROM users`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT COUNT(*) AS c FROM users WHERE role IN ('moderator','admin')`,
  ]);

  const stats = [
    { label: "Published Words", value: count(published), Icon: BookOpen, href: "/search" },
    { label: "Pending Submissions", value: count(pending), Icon: Inbox, href: "/admin/moderation" },
    { label: "Users", value: count(users), Icon: Users, href: "/admin/users" },
    { label: "Moderators", value: count(moderators), Icon: ShieldCheck, href: "/admin/users" },
  ];

  return (
    <>
      <Header />
      <AdminNav />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl border border-border bg-surface p-5 hover:border-brand-500 hover:shadow-card transition-all"
              >
                <Icon className="w-5 h-5 mb-2 text-brand-600 dark:text-brand-300" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Review pending submissions in{" "}
            <Link href="/admin/moderation" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Moderation
            </Link>
            , manage users in{" "}
            <Link href="/admin/users" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Users
            </Link>
            , and view history in{" "}
            <Link href="/admin/audit" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Audit Trail
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}