"use client";

import { cn } from "@/lib/cn";

export interface Column<T> {
  key: keyof T & string;
  label: string;
  /** Optional formatter for the cell value (defaults to a numeric formatter). */
  format?: (value: T[keyof T], row: T) => string;
}

interface IterationTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Maximum rows to render before scrolling (keeps long histories usable). */
  maxHeight?: number;
  caption?: string;
}

/** Default numeric formatter: 6 significant digits, English notation. */
function defaultFormat(value: unknown): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    if (value !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6)) {
      return value.toExponential(4);
    }
    return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }
  return String(value ?? "");
}

/**
 * Generic iteration/step-history table. Each module passes its own columns and
 * rows (e.g. RootStep[]), so one component renders every method's history.
 */
export function IterationTable<T extends object>({
  columns,
  rows,
  maxHeight = 320,
  caption,
}: IterationTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-400">No iterations to display.</p>
    );
  }
  return (
    <div
      className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800"
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse text-sm tabular-nums">
        {caption && (
          <caption className="px-3 py-2 text-left text-xs text-slate-400">
            {caption}
          </caption>
        )}
        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-slate-200 px-3 py-2 text-right font-medium text-slate-500 first:text-left dark:border-slate-700 dark:text-slate-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-slate-100 last:border-0 dark:border-slate-800/70",
                i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-800/30",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 py-1.5 text-right font-mono text-xs first:text-left first:font-sans"
                >
                  {col.format
                    ? col.format(row[col.key], row)
                    : defaultFormat(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
