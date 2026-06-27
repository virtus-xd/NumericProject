"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/navigation";

const GROUPS: { label: string; priority: "P0" | "P1" | "P2" }[] = [
  { label: "Core methods", priority: "P0" },
  { label: "Extended methods", priority: "P1" },
  { label: "Analysis & capstone", priority: "P2" },
];

/**
 * Shared navigation list (Home + grouped module links). Rendered by both the
 * desktop Sidebar and the mobile drawer. `onNavigate` lets the drawer close
 * itself when a link is followed.
 */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Modules" className="px-3 py-4">
      <NavItem href="/" label="Home" badge="A.11" active={pathname === "/"} onNavigate={onNavigate} />
      {GROUPS.map((group) => (
        <div key={group.priority} className="mt-5">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          {MODULES.filter((m) => m.priority === group.priority).map((m) => (
            <NavItem
              key={m.href}
              href={m.href}
              label={m.title}
              badge={m.topic}
              active={pathname === m.href}
              planned={m.status === "planned"}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavItem({
  href,
  label,
  badge,
  active,
  planned,
  onNavigate,
}: {
  href: string;
  label: string;
  badge?: string;
  active: boolean;
  planned?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        active
          ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        {label}
        {planned && (
          <span className="rounded bg-slate-100 px-1 text-[10px] uppercase text-slate-400 dark:bg-slate-800">
            soon
          </span>
        )}
      </span>
      {badge && <span className="font-mono text-[10px] text-slate-400">{badge}</span>}
    </Link>
  );
}
