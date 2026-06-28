import Link from "next/link";
import {
  Binary,
  Crosshair,
  Activity,
  AreaChart,
  Spline,
  Grid3x3,
  Layers,
  Waves,
  Target,
  Gauge,
  Rocket,
} from "lucide-react";
import { MODULES } from "@/lib/navigation";
import { Card } from "@/components/ui/Card";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";

/**
 * Per-module icon for the home grid. Keyed by the module route so it stays in
 * sync with the central MODULES list.
 */
const CARD_ICONS: Record<string, React.ReactNode> = {
  "/error-analysis": <Binary className="h-4 w-4 text-rose-500" />,
  "/root-finding": <Crosshair className="h-4 w-4 text-blue-500" />,
  "/differentiation": <Activity className="h-4 w-4 text-amber-500" />,
  "/integration": <AreaChart className="h-4 w-4 text-emerald-500" />,
  "/interpolation": <Spline className="h-4 w-4 text-purple-500" />,
  "/linear-systems": <Grid3x3 className="h-4 w-4 text-sky-500" />,
  "/lu-decomposition": <Layers className="h-4 w-4 text-teal-500" />,
  "/ode-solvers": <Waves className="h-4 w-4 text-cyan-500" />,
  "/optimization": <Target className="h-4 w-4 text-orange-500" />,
  "/benchmarks": <Gauge className="h-4 w-4 text-indigo-500" />,
  "/case-study": <Rocket className="h-4 w-4 text-fuchsia-500" />,
};

/** Build the equal-size bento items from the central module list. */
const BENTO_ITEMS: BentoItem[] = MODULES.map((m) => ({
  title: m.title,
  description: m.description,
  href: m.href,
  icon: CARD_ICONS[m.href],
  meta: m.topic,
  status: m.priority,
  cta: "Open module →",
}));

/** Home page: project introduction + a bento grid linking to every module. */
export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          155-4007 — Numerical Methods in Engineering
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Numerical Methods Explorer
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          An interactive teaching tool where every classic numerical method is{" "}
          <strong>implemented from scratch in TypeScript</strong> and visualized
          step by step. Type a function, choose a method, and watch each
          iteration converge — with live plots, full step histories, and side-by-side
          method comparisons. Everything runs in your browser; there is no backend.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Author: <strong className="text-slate-700 dark:text-slate-200">Erdem ÖZ</strong>{" "}
          · Student No. <span className="font-mono">23220030085</span> · Mersin University
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/root-finding"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Start with Root Finding →
          </Link>
          <Link
            href="/error-analysis"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Why floating-point matters
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Modules</h2>
        <BentoGrid items={BENTO_ITEMS} />
      </section>

      <section>
        <Card>
          <h2 className="mb-2 text-base font-semibold">Design principles</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>
              Every algorithm is written from scratch — no numerical libraries.
              mathjs is used only to parse the functions you type.
            </li>
            <li>
              Every solver returns its full iteration history, so the tables and
              plots are driven by the same data the math produces.
            </li>
            <li>
              Robust error handling everywhere: bad input fails gracefully with a
              human-readable explanation instead of crashing.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
