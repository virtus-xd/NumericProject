import Link from "next/link";
import { MODULES } from "@/lib/navigation";
import { Card } from "@/components/ui/Card";

/** Home page: project introduction + a card linking to every module. */
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-brand-600 dark:text-brand-300">
                    {m.topic}
                  </span>
                  <span
                    className={
                      m.status === "ready"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }
                  >
                    {m.status === "ready" ? "Ready" : "Coming soon"}
                  </span>
                </div>
                <h3 className="text-base font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  {m.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {m.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
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
