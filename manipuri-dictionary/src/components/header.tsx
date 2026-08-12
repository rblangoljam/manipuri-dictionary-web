import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileMenu } from "@/components/mobile-menu";
import { hasRole } from "@/lib/permissions";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const role = user?.role as string | undefined;
  const isMod = hasRole(role, "moderator");
  const isAdmin = hasRole(role, "admin");

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
            <BookOpen className="w-5 h-5" />
          </span>
          <span className="font-bold text-lg tracking-tight">
            Manipuri <span className="text-brand-600 dark:text-brand-400">Dictionary</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
            Dictionary
          </Link>
          <Link href="/bookmarks" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
            Bookmarks
          </Link>
          <Link href="/contribute" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
            Contribute
          </Link>
          {user && (
            <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
              My Contributions
            </Link>
          )}
          {isMod && (
            <Link href="/admin/moderation" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
              Moderation
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/users" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
              Users
            </Link>
          )}
          <Link href="/about" className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors">
            About
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-md bg-brand-50 dark:bg-brand-900/40 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
                title={user.email ?? ""}
              >
                {user.name || "User"}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu */}
          <MobileMenu signedIn={!!user} role={role} />
        </div>
      </div>
    </header>
  );
}