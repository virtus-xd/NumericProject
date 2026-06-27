"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface FunctionInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Parse error message to display, if any (from compileScalar). */
  error?: string | null;
  placeholder?: string;
  className?: string;
}

/**
 * Text box for a user-typed math expression (e.g. "x^2 - 2"). Purely
 * presentational: the parent compiles the string via `compileScalar`
 * (the mathjs wrapper) and passes back any parse error to render here.
 */
export function FunctionInput({
  label = "f(x)",
  value,
  onChange,
  error,
  placeholder = "x^2 - 2",
  className,
}: FunctionInputProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        spellCheck={false}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border bg-white px-2.5 py-1.5 font-mono text-sm shadow-sm focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500"
            : "border-slate-300 focus:border-brand-500 focus:ring-brand-500 dark:border-slate-700",
        )}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
