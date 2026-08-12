"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = async (userId: number, action: "role" | "status", value: string) => {
    if (busy) return;
    setBusy(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update user");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted dark:bg-slate-900 text-left text-xs text-muted-2 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Submitted / Approved / Rejected</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-2">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busy === u.id || isSelf}
                      onChange={(e) => update(u.id, "role", e.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-surface text-sm disabled:opacity-60"
                    >
                      <option value="user">User</option>
                      <option value="contributor">Contributor</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => update(u.id, "status", u.status === "active" ? "banned" : "active")}
                      disabled={busy === u.id || (isSelf && u.status === "active")}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
                        u.status === "active"
                          ? "bg-success/10 text-success hover:bg-danger/10 hover:text-danger"
                          : "bg-danger/10 text-danger hover:bg-success/10 hover:text-success"
                      }`}
                      title={isSelf ? "You cannot ban yourself" : "Toggle account status"}
                    >
                      {u.status === "active" ? "Active" : "Banned"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-muted-2">
                      {u.nos_word_submitted} / {u.nos_word_approved} / {u.nos_word_rejected}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}