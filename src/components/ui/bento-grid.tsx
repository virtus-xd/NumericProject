"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Optional route — when set, the whole card becomes a link. */
  href?: string;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
}

/**
 * Responsive "bento" card grid. Each item renders as a hoverable card; when an
 * item has an `href`, the card is wrapped in a Next.js Link so the whole tile is
 * clickable. Adapted from a 21st.dev component to use this project's `cn` helper.
 */
function BentoGrid({ items }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {items.map((item, index) => {
        const cardClass = cn(
          "group relative flex h-full flex-col overflow-hidden rounded-xl p-4 transition-all duration-300",
          "border border-gray-100/80 bg-white dark:border-white/10 dark:bg-black",
          "hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.03)]",
          "hover:-translate-y-0.5 will-change-transform",
          item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
          item.hasPersistentHover &&
            "-translate-y-0.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)]"
        );

        const content = (
          <>
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:4px_4px] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
            </div>

            <div className="relative flex flex-1 flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 transition-all duration-300 dark:bg-white/10">
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm",
                    "bg-black/5 text-gray-600 dark:bg-white/10 dark:text-gray-300",
                    "transition-colors duration-300 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                  )}
                >
                  {item.status || "Active"}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[15px] font-medium tracking-tight text-gray-900 dark:text-gray-100">
                  {item.title}
                  {item.meta && (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {item.meta}
                    </span>
                  )}
                </h3>
                <p className="text-sm font-[425] leading-snug text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-end pt-2">
                <span className="text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-400">
                  {item.cta || "Explore →"}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent via-gray-100/50 to-transparent p-px transition-opacity duration-300 dark:via-white/10",
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            />
          </>
        );

        if (item.href) {
          return (
            <Link key={index} href={item.href} className={cardClass}>
              {content}
            </Link>
          );
        }

        return (
          <div key={index} className={cardClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export { BentoGrid };
