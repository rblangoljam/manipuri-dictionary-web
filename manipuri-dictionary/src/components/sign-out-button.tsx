"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="hidden sm:inline-flex items-center px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
    >
      Sign Out
    </button>
  );
}