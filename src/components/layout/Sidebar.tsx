import Link from "next/link";
import { NavLinks } from "./NavLinks";

/**
 * Desktop left navigation rail. Hidden on small screens, where the MobileNav
 * drawer in the header takes over.
 */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
        <Link
          href="/"
          className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm font-bold text-white">
            ∑
          </span>
          <span className="text-sm font-semibold leading-tight">
            Numerical Methods
            <br />
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Explorer
            </span>
          </span>
        </Link>

        <div className="flex-1">
          <NavLinks />
        </div>

        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400 dark:border-slate-800">
          155-4007 · From-scratch in TypeScript
        </p>
      </div>
    </aside>
  );
}
