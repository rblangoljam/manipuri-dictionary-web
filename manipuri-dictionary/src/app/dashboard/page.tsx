import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Header } from "@/components/header";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "My Contributions — Manipuri Dictionary",
  description: "Track your contribution status.",
};

interface ContributionRow {
  id: bigint;
  type: string;
  proposed_word: string;
  status: string;
  created_at: Date;
  reviewed_at: Date | null;
  reviewed_name: string | null;
  rejection_reason: string | null;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const userId = parseInt(session.user.id, 10);

  const rows = await prisma.$queryRaw<ContributionRow[]>`
    SELECT
      ep.id,
      CASE WHEN ep.word_id IS NULL AND ep.sense_id IS NULL THEN 'new' ELSE 'edit' END AS type,
      ep.proposed_word,
      ep.status,
      ep.created_at,
      ep.reviewed_at,
      rv.name AS reviewed_name,
      ep.rejection_reason
    FROM edit_proposals ep
    LEFT JOIN users rv ON rv.id = ep.reviewed_by
    WHERE ep.submitted_by = ${userId}
    ORDER BY ep.created_at DESC
    LIMIT 100
  `;

  const total = rows.length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  const statCards = [
    { label: "Total", value: total, Icon: FileText, color: "text-foreground" },
    { label: "Approved", value: approved, Icon: CheckCircle2, color: "text-success" },
    { label: "Pending", value: pending, Icon: Clock, color: "text-warning" },
    { label: "Rejected", value: rejected, Icon: XCircle, color: "text-danger" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">My Contributions</h1>
            <Link
              href="/contribute/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              New suggestion
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {statCards.map(({ label, value, Icon, color }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {total === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border bg-surface-muted dark:bg-slate-900">
              <FileText className="w-12 h-12 mx-auto text-muted-2 mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't submitted any words or edits yet.
              </p>
              <Link
                href="/contribute/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Make your first contribution
              </Link>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              {rows.map((r) => (
                <div
                  key={r.id.toString()}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-medium">{r.proposed_word}</div>
                    <div className="text-xs text-muted-2 mt-0.5">
                      {r.type === "new" ? "New word" : "Edit"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                      {r.reviewed_name ? ` · Reviewed by ${r.reviewed_name}` : ""}
                    </div>
                    {r.status === "rejected" && r.rejection_reason && (
                      <div className="text-xs text-danger mt-1">
                        Reason: {r.rejection_reason}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.status === "approved"
                        ? "bg-success/10 text-success"
                        : r.status === "rejected"
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}