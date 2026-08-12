import Link from "next/link";
import { redirect } from "next/navigation";
import { User as UserIcon, Calendar, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Header } from "@/components/header";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";

export const metadata = {
  title: "Profile — Manipuri Dictionary",
  description: "Your Manipuri Dictionary profile.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const userId = parseInt(session.user.id, 10);

  const rows = await prisma.$queryRaw<Array<{ id: number; name: string; email: string; role: string; status: string; nos_word_submitted: number; nos_word_approved: number; nos_word_rejected: number; created_at: Date }>>`
    SELECT id, name, email, role, status, nos_word_submitted, nos_word_approved, nos_word_rejected, created_at
    FROM users WHERE id = ${userId} LIMIT 1
  `;

  if (!rows[0]) {
    redirect("/login");
  }

  const user = rows[0];
  const total = user.nos_word_submitted;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>

          <div className="rounded-xl border border-border bg-surface p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                <UserIcon className="w-7 h-7" />
              </span>
              <div>
                <div className="text-lg font-bold">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="px-3 py-2 rounded-lg bg-surface-muted dark:bg-slate-800">
                <div className="text-xs text-muted-2">Role</div>
                <div className="font-medium">{roleLabel(user.role)}</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-surface-muted dark:bg-slate-800">
                <div className="text-xs text-muted-2">Status</div>
                <div className="font-medium capitalize">{user.status}</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-surface-muted dark:bg-slate-800">
                <div className="text-xs text-muted-2">Member since</div>
                <div className="font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Contribution stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-border bg-surface p-4">
              <FileText className="w-5 h-5 mb-2" />
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <CheckCircle2 className="w-5 h-5 mb-2 text-success" />
              <div className="text-2xl font-bold">{user.nos_word_approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Clock className="w-5 h-5 mb-2 text-warning" />
              <div className="text-2xl font-bold">
                {Math.max(0, total - user.nos_word_approved - user.nos_word_rejected)}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <XCircle className="w-5 h-5 mb-2 text-danger" />
              <div className="text-2xl font-bold">{user.nos_word_rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              View my contributions
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
            >
              Account settings
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}