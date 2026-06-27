"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  /** Formats the value shown next to the label (defaults to String). */
  format?: (value: number) => string;
}

/** Labeled range slider with a live value read-out. */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  format = (v) => String(v),
}: SliderProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        <span>{label}</span>
        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {format(value)}
        </span>
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
      />
    </div>
  );
}
