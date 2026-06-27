"use client";

import { useEffect, useState } from "react";
import { MobileNav } from "./MobileNav";

/**
 * Top bar with the course label and a light/dark theme toggle. The toggle
 * flips the `dark` class on <html> and persists the choice to localStorage.
 */
export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-base">
            155-4007 — Numerical Methods in Engineering
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            Interactive, from-scratch implementations · 100% client-side
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle color theme"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {isDark ? "☀ Light" : "🌙 Dark"}
      </button>
    </header>
  );
}
