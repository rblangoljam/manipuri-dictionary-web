import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { AdminNav } from "@/components/admin/admin-nav";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const metadata = {
  title: "Audit Trail — Manipuri Dictionary",
};

interface AuditRow {
  id: bigint;
  action: string;
  note: string | null;
  moderator_name: string | null;
  moderator_email: string | null;
  proposed_word: string | null;
  created_at: Date;
}

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.role)) {
    redirect("/login?callbackUrl=/admin/audit");
  }

  const rows = await prisma.$queryRaw<AuditRow[]>`
    SELECT
      ml.id, ml.action, ml.note,
      u.name AS moderator_name, u.email AS moderator_email,
      ep.proposed_word, ml.created_at
    FROM moderation_logs ml
    LEFT JOIN users u ON u.id = ml.moderator_id
    LEFT JOIN edit_proposals ep ON ep.id = ml.proposal_id
    ORDER BY ml.created_at DESC
    LIMIT 200
  `;

  return (
    <>
      <Header />
      <AdminNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Audit Trail</h1>

          {rows.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border bg-surface">
              <p className="text-muted-foreground">No moderation activity yet.</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              {rows.map((a) => (
                <div key={a.id.toString()} className="flex items-start justify-between px-4 py-3 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium text-sm">
                      {a.action === "approve" ? "Approved" : "Rejected"}{" "}
                      {a.proposed_word ?? "proposal"}
                    </div>
                    <div className="text-xs text-muted-2 mt-0.5">
                      {a.moderator_name ?? "Unknown"} ({a.moderator_email ?? "no email"}) ·{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                    {a.note && <div className="text-xs text-muted-foreground mt-1">Note: {a.note}</div>}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    a.action === "approve" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}>
                    {a.action.charAt(0).toUpperCase() + a.action.slice(1)}
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