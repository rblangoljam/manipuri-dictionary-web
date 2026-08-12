import Link from "next/link";
import { LayoutDashboard, Inbox, Users, ScrollText } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/moderation", label: "Moderation", Icon: Inbox },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/audit", label: "Audit Trail", Icon: ScrollText },
];

export function AdminNav() {
  return (
    <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
      {links.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="px-3 py-2 rounded-md hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}