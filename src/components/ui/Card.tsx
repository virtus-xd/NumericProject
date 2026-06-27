import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Surface container used to group related content on a page. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      {...props}
    />
  );
}

/** Optional titled header for a Card. */
export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("mb-3 text-base font-semibold", className)}>{children}</h2>
  );
}
