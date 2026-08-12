import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { AdminNav } from "@/components/admin/admin-nav";
import { UsersTable } from "@/components/admin/users-table";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export const metadata = {
  title: "User Management — Manipuri Dictionary",
};

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  nos_word_submitted: number;
  nos_word_approved: number;
  nos_word_rejected: number;
}

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/login?callbackUrl=/admin/users");
  }

  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT id, name, email, role, status, nos_word_submitted, nos_word_approved, nos_word_rejected
    FROM users ORDER BY id ASC
  `;

  const currentUserId = parseInt(session.user.id, 10);

  return (
    <>
      <Header />
      <AdminNav />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">User Management</h1>
          <UsersTable users={rows} currentUserId={currentUserId} />
        </div>
      </main>
    </>
  );
}