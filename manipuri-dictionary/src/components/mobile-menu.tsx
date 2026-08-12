"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, Bookmark, ArrowLeftRight, LayoutDashboard, Inbox, Users, User as UserIcon, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

interface MobileMenuProps {
  signedIn: boolean;
  role?: string;
}

export function MobileMenu({ signedIn, role }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const isMod = role === "moderator" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-surface dark:bg-slate-900 shadow-popover overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <Link href="/" onClick={() => setOpen(false)} className="font-bold text-lg">
                Manipuri <span className="text-brand-600 dark:text-brand-400">Dictionary</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                Dictionary
              </Link>
              <Link href="/search" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                <ArrowLeftRight className="w-4 h-4" />
                Search
              </Link>
              <Link href="/bookmarks" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </Link>
              <Link href="/contribute" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                Contribute
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                About
              </Link>

              {signedIn && (
                <>
                  <div className="pt-3 mt-3 border-t border-border space-y-1">
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                      <LayoutDashboard className="w-4 h-4" />
                      My Contributions
                    </Link>
                    <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>

                  {isMod && (
                    <div className="pt-3 mt-3 border-t border-border space-y-1">
                      <div className="px-3 py-1 text-xs font-medium text-muted-2 uppercase tracking-wide">
                        Moderation
                      </div>
                      <Link href="/admin/moderation" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                        <Inbox className="w-4 h-4" />
                        Pending Reviews
                      </Link>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="pt-3 mt-3 border-t border-border space-y-1">
                      <div className="px-3 py-1 text-xs font-medium text-muted-2 uppercase tracking-wide">
                        Admin
                      </div>
                      <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link href="/admin/users" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                        <Users className="w-4 h-4" />
                        Users
                      </Link>
                    </div>
                  )}
                </>
              )}
            </nav>

            <div className="p-4 border-t border-border">
              {signedIn ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}