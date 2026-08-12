import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReviewPanel } from "@/components/admin/review-panel";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const metadata = {
  title: "Moderation — Manipuri Dictionary",
};

interface ProposalRow {
  id: bigint;
  type: string;
  proposed_word: string;
  proposed_wordtype: string;
  proposed_definition: string;
  proposed_meaning_eng_man: string;
  proposed_meaning_mm: string;
  proposed_synonyms: string;
  proposed_antonyms: string;
  submitted_name: string | null;
  submitted_email: string | null;
  created_at: Date;
  current_definition: string | null;
  current_wordtype: string | null;
}

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.role)) {
    redirect("/login?callbackUrl=/admin/moderation");
  }

  const rows = await prisma.$queryRaw<ProposalRow[]>`
    SELECT
      ep.id,
      CASE WHEN ep.word_id IS NULL AND ep.sense_id IS NULL THEN 'new' ELSE 'edit' END AS type,
      ep.proposed_word, ep.proposed_wordtype, ep.proposed_definition,
      ep.proposed_meaning_eng_man, ep.proposed_meaning_mm,
      ep.proposed_synonyms, ep.proposed_antonyms,
      u.name AS submitted_name, u.email AS submitted_email, ep.created_at,
      ws.definition AS current_definition, ws.wordtype AS current_wordtype
    FROM edit_proposals ep
    LEFT JOIN users u ON u.id = ep.submitted_by
    LEFT JOIN word_senses ws ON ws.id = ep.sense_id
    WHERE ep.status = 'pending'
    ORDER BY ep.created_at DESC
    LIMIT 100
  `;

  const proposals = rows.map((r) => ({ ...r, id: r.id.toString(), created_at: r.created_at.toString() }));

  return (
    <>
      <Header />
      <AdminNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Moderation — Pending Review</h1>
          <ReviewPanel proposals={proposals} />
        </div>
      </main>
    </>
  );
}