"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  /** Optional helper/units text shown to the right of the label. */
  hint?: string;
}

/**
 * Labeled numeric input. Reports the parsed number through `onChange`; ignores
 * intermediate non-numeric states so typing a minus sign or decimal point works.
 */
export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  className,
  hint,
}: NumberInputProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        <span>{label}</span>
        {hint && <span className="text-slate-400">{hint}</span>}
      </label>
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm tabular-nums shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
}
